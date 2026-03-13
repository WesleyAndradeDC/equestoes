-- AlterTable: torna option_c, option_d, option_e opcionais
-- Necessário para suportar questões do tipo "Certo ou Errado"
-- que utilizam apenas as alternativas A (Certo) e B (Errado).
ALTER TABLE "questions" ALTER COLUMN "option_c" DROP NOT NULL;
ALTER TABLE "questions" ALTER COLUMN "option_d" DROP NOT NULL;
ALTER TABLE "questions" ALTER COLUMN "option_e" DROP NOT NULL;
