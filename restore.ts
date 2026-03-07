import { PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";
import * as fs from "fs";
import * as dotenv from "dotenv";

dotenv.config();

// This connects to the NEW database (DATABASE_URL now points to the new account)
const prisma = new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL,
}).$extends(withAccelerate());

async function restore() {
    console.log("🔄 Starting restore to NEW database...\n");

    // Read backup file
    const backupFile = fs.readdirSync(".").find((f) => f.startsWith("backup_") && f.endsWith(".json"));
    if (!backupFile) {
        console.error("❌ No backup file found!");
        return;
    }

    console.log(`📂 Reading backup from: ${backupFile}`);
    const backup = JSON.parse(fs.readFileSync(backupFile, "utf-8"));
    const data = backup.data;

    try {
        // 1. Restore Sectors (must be first — Startups depend on Sector via FK)
        console.log(`\n📦 Restoring ${data.sectors.length} Sectors...`);
        for (const sector of data.sectors) {
            await prisma.sector.create({ data: sector });
        }
        console.log("   ✅ Sectors restored");

        // 2. Restore Users
        console.log(`📦 Restoring ${data.users.length} Users...`);
        for (const user of data.users) {
            await prisma.user.create({ data: user });
        }
        console.log("   ✅ Users restored");

        // 3. Restore Articles
        console.log(`📦 Restoring ${data.articles.length} Articles...`);
        let articleCount = 0;
        for (const article of data.articles) {
            // Remove relation fields, keep only scalar fields
            const { ArticlesSentiment, ...articleData } = article as any;
            await prisma.articles.create({ data: articleData });
            articleCount++;
            if (articleCount % 100 === 0) {
                console.log(`   ... ${articleCount}/${data.articles.length} articles done`);
            }
        }
        console.log(`   ✅ Articles restored (${articleCount})`);

        // 4. Restore Startups
        console.log(`📦 Restoring ${data.startups.length} Startups...`);
        for (const startup of data.startups) {
            // Remove relation fields, use sectorId directly
            const { ArticlesSentiment, sector, ...startupData } = startup as any;
            await prisma.startups.create({ data: startupData });
        }
        console.log("   ✅ Startups restored");

        // 5. Restore ArticlesSentiment
        console.log(`📦 Restoring ${data.articlesSentiment.length} ArticlesSentiment records...`);
        let sentimentCount = 0;
        for (const sentiment of data.articlesSentiment) {
            // Remove relation fields
            const { Articles, Startups, ...sentimentData } = sentiment as any;
            await prisma.articlesSentiment.create({ data: sentimentData });
            sentimentCount++;
            if (sentimentCount % 100 === 0) {
                console.log(`   ... ${sentimentCount}/${data.articlesSentiment.length} sentiments done`);
            }
        }
        console.log(`   ✅ ArticlesSentiment restored (${sentimentCount})`);

        // Verify counts
        console.log("\n📊 Verification — Counting records in NEW database:");
        const userCount = await prisma.user.count();
        const sectorCount = await prisma.sector.count();
        const articlesCount = await prisma.articles.count();
        const startupsCount = await prisma.startups.count();
        const asSentimentCount = await prisma.articlesSentiment.count();

        console.log(`   Users:              ${userCount} (expected ${data.users.length})`);
        console.log(`   Sectors:            ${sectorCount} (expected ${data.sectors.length})`);
        console.log(`   Articles:           ${articlesCount} (expected ${data.articles.length})`);
        console.log(`   Startups:           ${startupsCount} (expected ${data.startups.length})`);
        console.log(`   ArticlesSentiment:  ${asSentimentCount} (expected ${data.articlesSentiment.length})`);

        const allMatch =
            userCount === data.users.length &&
            sectorCount === data.sectors.length &&
            articlesCount === data.articles.length &&
            startupsCount === data.startups.length &&
            asSentimentCount === data.articlesSentiment.length;

        if (allMatch) {
            console.log("\n✅ ALL RECORDS MATCH! Migration is 1:1 with the old database.");
        } else {
            console.log("\n⚠️ MISMATCH DETECTED! Some counts don't match. Please investigate.");
        }
    } catch (error) {
        console.error("❌ Restore failed:", error);
    } finally {
        await prisma.$disconnect();
    }
}

restore();
