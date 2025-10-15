-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "date_of_birth" TIMESTAMP(3),
ADD COLUMN     "department" TEXT,
ADD COLUMN     "faculty" TEXT,
ADD COLUMN     "phone_number" TEXT,
ADD COLUMN     "religion" TEXT,
ADD COLUMN     "state_of_origin" TEXT;
