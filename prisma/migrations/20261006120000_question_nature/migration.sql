CREATE TYPE "QuestionNature" AS ENUM ('CONCEPTUAL_THEORY', 'NUMERICAL_PROBLEM_SOLVING');
ALTER TABLE "Question" ADD COLUMN "questionNature" "QuestionNature";
ALTER TABLE "TestAttempt" ADD COLUMN "questionNature" "QuestionNature";
