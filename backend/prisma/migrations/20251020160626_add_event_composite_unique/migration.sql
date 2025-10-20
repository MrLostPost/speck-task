/*
  Warnings:

  - A unique constraint covering the columns `[userId,title,start,end]` on the table `Event` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Event_userId_title_start_end_key" ON "Event"("userId", "title", "start", "end");
