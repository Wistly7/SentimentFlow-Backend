import { PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";
import * as fs from "fs";
import * as dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL,
}).$extends(withAccelerate());

async function backup() {
    console.log("🔄 Starting backup from DATABASE_URL...\n");

    try {
        // 1. Backup Users
        console.log("📦 Fetching Users...");
        const users = await prisma.user.findMany();
        console.log(`   Found ${users.length} users`);

        // 2. Backup Sectors (needed before Startups due to FK)
        console.log("📦 Fetching Sectors...");
        const sectors = await prisma.sector.findMany();
        console.log(`   Found ${sectors.length} sectors`);

        // 3. Backup Articles
        console.log("📦 Fetching Articles...");
        const articles = await prisma.articles.findMany();
        console.log(`   Found ${articles.length} articles`);

        // 4. Backup Startups
        console.log("📦 Fetching Startups...");
        const startups = await prisma.startups.findMany();
        console.log(`   Found ${startups.length} startups`);

        // 5. Backup ArticlesSentiment
        console.log("📦 Fetching ArticlesSentiment...");
        const articlesSentiment = await prisma.articlesSentiment.findMany();
        console.log(`   Found ${articlesSentiment.length} article sentiments`);

        // Build backup object
        const backupData = {
            exportedAt: new Date().toISOString(),
            sourceUrl: "DATABASE_URL (old account)",
            data: {
                users,
                sectors,
                articles,
                startups,
                articlesSentiment,
            },
        };

        // Write to file
        const filename = `backup_${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
        fs.writeFileSync(filename, JSON.stringify(backupData, null, 2));

        console.log(`\n✅ Backup complete! Saved to: ${filename}`);
        console.log(`\n📊 Summary:`);
        console.log(`   Users:              ${users.length}`);
        console.log(`   Sectors:            ${sectors.length}`);
        console.log(`   Articles:           ${articles.length}`);
        console.log(`   Startups:           ${startups.length}`);
        console.log(`   ArticlesSentiment:  ${articlesSentiment.length}`);
    } catch (error) {
        console.error("❌ Backup failed:", error);
    } finally {
        await prisma.$disconnect();
    }
}

backup();
