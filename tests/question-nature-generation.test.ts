import { beforeEach, expect, it, vi } from 'vitest';
vi.mock('@/lib/prisma', () => ({prisma:{test:{findUnique:vi.fn()},question:{findMany:vi.fn()},testQuestion:{findMany:vi.fn()}}}));
import { prisma } from '@/lib/prisma';
import { generateForAttempt } from '@/lib/generator/plan';

const mixed = {id:'mixed',testType:'FULL_TEST',totalQuestions:180,durationMinutes:180,isRandom:true,
  availableLanguages:['en'],rules:{exam:'NEET',previousYearMode:'MIXED_FIVE_YEARS',historical:{years:[2021,2022,2023,2024,2025]},random:{scope:'FULL_SYLLABUS'}}};
beforeEach(()=>vi.clearAllMocks());
it('starts filtered mixed practice with the actual eligible count instead of enforcing original 180-question quotas', async()=>{
  vi.mocked(prisma.test.findUnique).mockResolvedValue(mixed as never);
  vi.mocked(prisma.question.findMany)
    .mockResolvedValueOnce([{id:'q',subjectId:'physics',chapterId:'current',difficulty:'MEDIUM',examYear:2024}] as never)
    .mockResolvedValueOnce([{questionType:'SINGLE_CORRECT',subject:{code:'PHYSICS'},translations:[{language:'en',correctOption:'A',numericAnswer:null}]}] as never);
  expect(await generateForAttempt('mixed','en','seed','NUMERICAL_PROBLEM_SOLVING')).toEqual({questionIds:['q'],warnings:[]});
});
it('rejects a nature restriction on a real Full Mock',async()=>{
  vi.mocked(prisma.test.findUnique).mockResolvedValue({...mixed,rules:{exam:'NEET'}} as never);
  await expect(generateForAttempt('mock','en','seed','CONCEPTUAL_THEORY')).rejects.toThrow('only available for NEET');
  expect(prisma.question.findMany).not.toHaveBeenCalled();
});
it('preserves fixed All Questions membership and original order',async()=>{
  vi.mocked(prisma.test.findUnique).mockResolvedValue({...mixed,testType:'YEAR_PATTERN',isRandom:false,totalQuestions:2} as never);
  vi.mocked(prisma.testQuestion.findMany).mockResolvedValue([{questionId:'second'},{questionId:'first'}] as never);
  vi.mocked(prisma.question.findMany).mockResolvedValue([1,2].map(()=>({questionType:'SINGLE_CORRECT',subject:{code:'PHYSICS'},translations:[{language:'en',correctOption:'A',numericAnswer:null}]})) as never);
  expect((await generateForAttempt('year','en','seed')).questionIds).toEqual(['second','first']);
  expect(prisma.testQuestion.findMany).toHaveBeenCalledWith(expect.objectContaining({orderBy:{order:'asc'}}));
});
