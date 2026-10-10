import q2019 from '@/data/previous-year/neet/2019/questions.json';
import q2020 from '@/data/previous-year/neet/2020/questions.json';
import q2021 from '@/data/previous-year/neet/2021/questions.json';
import q2022 from '@/data/previous-year/neet/2022/questions.json';
import q2023 from '@/data/previous-year/neet/2023/questions.json';
import q2024 from '@/data/previous-year/neet/2024/questions.json';
import q2025 from '@/data/previous-year/neet/2025/questions.json';

// Repository validation is not database approval. Never use these counts as availability.
export const neetValidatedCatalogue = [...q2019, ...q2020, ...q2021, ...q2022, ...q2023, ...q2024, ...q2025];
