import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import artifact from '@/data/previous-year/neet/question-nature.json';
import { questionNatureSchema, natureStartUrl } from '@/lib/previous-year/question-nature';
import { startAttemptSchema } from '@/lib/validation/attempt';

vi.mock('@/lib/prisma', () => ({ prisma: { question: { findMany: vi.fn(), groupBy: vi.fn() } } }));
import { prisma } from '@/lib/prisma';
import { supportsNature, naturePoolWhere, generateNaturePractice, selectNaturePool } from '@/lib/previous-year/nature-pool';
import type { GeneratorQuestion } from '@/lib/generator';

const years = [2021,2022,2023,2024,2025];
const sources = years.flatMap(y => JSON.parse(readFileSync(`data/previous-year/neet/${y}/questions.json`, 'utf8')));
const row = (year: number, n: number) => artifact.rows.find(q => q.year === year && q.externalId.endsWith(`:${n}`))!;
const hash = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');

describe('canonical classification', () => {
  it('has exactly the protected 780 unique validated IDs and unchanged source fingerprints', () => {
    expect(artifact.rows).toHaveLength(780);
    expect(new Set(artifact.rows.map(q => q.externalId)).size).toBe(780);
    expect(artifact.manifestSha256).toBe(hash(sources));
    for (const source of sources) {
      const r = artifact.rows.find(q => q.externalId === source.externalId)!;
      expect(r.sourceSha256).toBe(hash(source));
      expect(questionNatureSchema.safeParse(r.questionNature).success).toBe(true);
      expect(r.year).toBe(source.year);
      expect(r.subject).toBe(source.subjectCode);
      expect(r.chapter).toBe(source.chapterSlug);
    }
    const quarantine = years.flatMap(y => JSON.parse(readFileSync(`data/previous-year/neet/${y}/quarantine.json`, 'utf8')));
    expect(quarantine).toHaveLength(200);
    expect(quarantine.some(q => artifact.rows.some(r => r.externalId === q.externalId))).toBe(false);
  });
  it('rebuilds byte-equivalent decisions deterministically', () => {
    const rebuilt = execFileSync(process.execPath, ['--input-type=module', '-e', "import {buildArtifact} from './scripts/build-neet-question-nature.mjs'; console.log(JSON.stringify(buildArtifact()));"], { encoding: 'utf8' });
    expect(JSON.parse(rebuilt)).toEqual(artifact);
  });
  it('counts every year and subject without imposing quotas', () => {
    expect(artifact.distribution.byYear).toMatchObject({2021: {total:113},2022: {total:157},2023: {total:172},2024: {total:171},2025: {total:167}});
    expect(artifact.distribution.bySubject.PHYSICS).toMatchObject({total:149, conceptual:49, numerical:100});
    expect(artifact.distribution.bySubject.CHEMISTRY).toMatchObject({total:190, conceptual:146, numerical:44});
    expect(artifact.distribution.bySubject.BIOLOGY).toMatchObject({total:441, conceptual:434, numerical:7});
    expect(artifact.distribution.conceptual + artifact.distribution.numerical).toBe(780);
    expect(artifact.distribution.reviewRequired).toBe(0);
  });
  it('distinguishes factual numbers from calculation and classifies MCQs independently of answer type', () => {
    expect(row(2021,66).questionNature).toBe('CONCEPTUAL_THEORY'); // furnace temperature recall
    expect(row(2022,184).questionNature).toBe('CONCEPTUAL_THEORY'); // blood oxygen recall
    expect(row(2024,106).questionNature).toBe('CONCEPTUAL_THEORY'); // Calvin-cycle requirement recall
    expect(row(2021,8).questionNature).toBe('NUMERICAL_PROBLEM_SOLVING'); // MCQ optics
    expect(row(2022,185).questionNature).toBe('NUMERICAL_PROBLEM_SOLVING'); // DNA length calculation
    expect(row(2024,68).questionNature).toBe('CONCEPTUAL_THEORY'); // says 'calculated' but asks knowledge
  });
});

describe('nature filters', () => {
  it('validates the two values and treats All Questions as absence of a restriction', () => {
    expect(questionNatureSchema.safeParse('SINGLE_CORRECT').success).toBe(false);
    expect(startAttemptSchema.parse({testId:'test',language:'en'})).not.toHaveProperty('questionNature');
    expect(startAttemptSchema.safeParse({testId:'test',language:'en',questionNature:'ALL'}).success).toBe(false);
    expect(natureStartUrl('test')).toBe('/student/tests/test/start');
    expect(natureStartUrl('test', 'CONCEPTUAL_THEORY')).toBe('/student/tests/test/start?nature=CONCEPTUAL_THEORY');
  });
  it('leaves Full Mocks, samples and JEE outside the feature', () => {
    for (const test of [{testType:'FULL_TEST',rules:{exam:'NEET'}}, {testType:'MINI_TEST',rules:null}, {testType:'YEAR_PATTERN',rules:{exam:'JEE'}}]) expect(supportsNature(test)).toBe(false);
  });
  it('scopes fixed year papers to their existing membership', () => {
    expect(naturePoolWhere({id:'year2024',isRandom:false,rules:{}})).toMatchObject({exam:'NEET',testQuestions:{some:{testId:'year2024'}}});
  });
  it.each([
    [[2024],[],[]], [years,[],[]], [[2024],['physics'],[]], [years,['chemistry'],[]],
    [[2024],[],['current']], [years,[],['current']], [[2024],['physics'],['current']], [years,['physics'],['current']],
  ])('composes year/mixed, subject and chapter scope: %j %j %j', (selectedYears, subjectIds, chapterIds) => {
    const where = naturePoolWhere({id:'practice',isRandom:true,rules:{historical:{years:selectedYears},random:{subjectIds,chapterIds}}});
    expect(where).toMatchObject({exam:'NEET',examYear:{in:selectedYears},sourceType:'HISTORICAL_VERIFIED',reviewState:'APPROVED',isActive:true});
    expect(where.externalId).toEqual({in:artifact.rows.map(q=>q.externalId)});
    if (subjectIds.length) expect(where.subjectId).toEqual({in:subjectIds});
    if (chapterIds.length) expect(where.chapterId).toEqual({in:chapterIds});
  });
  it.each(['CONCEPTUAL_THEORY','NUMERICAL_PROBLEM_SOLVING'] as const)('applies %s on the server with language availability', async nature => {
    vi.mocked(prisma.question.findMany).mockResolvedValue([]);
    await expect(generateNaturePractice({id:'test',isRandom:false,rules:{},totalQuestions:20},nature,'en','seed')).rejects.toThrow('No validated questions');
    expect(prisma.question.findMany).toHaveBeenLastCalledWith(expect.objectContaining({where:expect.objectContaining({questionNature:nature,translations:{some:{language:'en'}}})}));
  });
  it('balances mixed years reproducibly, respects smaller pools and never duplicates IDs', () => {
    const pool: GeneratorQuestion[] = years.flatMap(year => Array.from({length:10},(_,i)=>({id:`${year}-${i}`,subjectId:'physics',chapterId:'current',difficulty:'MEDIUM',hasReviewedTa:true,year})));
    const a = selectNaturePool(pool,20,'fixed');
    expect(a).toEqual(selectNaturePool(pool,20,'fixed'));
    expect(new Set(a.questionIds).size).toBe(20);
    for (const year of years) expect(a.questionIds.filter(id=>id.startsWith(`${year}-`))).toHaveLength(4);
    expect(selectNaturePool(pool.slice(0,3),20,'seed').questionIds).toHaveLength(3);
    expect(()=>selectNaturePool([],20,'seed')).toThrow('No validated questions');
  });
});
