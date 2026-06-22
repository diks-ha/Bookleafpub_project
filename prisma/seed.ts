/**
 * Database seed — reads prisma/data/sample_data.json and creates
 * User + Author + Book records.
 *
 * Default passwords:
 *   Authors : password123
 *   Admin   : admin@bookleaf.com / adminpass123
 *
 * Run: npm run db:seed
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import path from "path";
import fs from "fs";

const prisma = new PrismaClient();

interface RawBook {
    book_id: string;
    title: string;
    isbn: string;
    genre: string;
    publication_date: string | null;
    status: string;
    mrp: number | null;
    author_royalty_per_copy: number | null;
    total_copies_sold: number;
    total_royalty_earned: number;
    royalty_paid: number;
    royalty_pending: number;
    last_royalty_payout_date: string | null;
    print_partner: string | null;
    available_on: string[];
}

interface RawAuthor {
    author_id: string;
    name: string;
    email: string;
    phone: string;
    city: string;
    joined_date: string;
    books: RawBook[];
}

async function main() {
    console.log("🌱 Seeding database...");

    // Data file is bundled inside the repo at prisma/data/sample_data.json
    const dataPath = path.join(__dirname, "data", "sample_data.json");
    const raw = JSON.parse(fs.readFileSync(dataPath, "utf-8")) as {
        authors: RawAuthor[];
    };

    const authorPassword = await bcrypt.hash("password123", 12);
    const adminPassword = await bcrypt.hash("adminpass123", 12);

    // Admin user
    await prisma.user.upsert({
        where: { email: "admin@bookleaf.com" },
        update: {},
        create: {
            email: "admin@bookleaf.com",
            password: adminPassword,
            role: "admin",
        },
    });
    console.log("✅ Admin: admin@bookleaf.com / adminpass123");

    for (const rawAuthor of raw.authors) {
        const user = await prisma.user.upsert({
            where: { email: rawAuthor.email },
            update: {},
            create: {
                email: rawAuthor.email,
                password: authorPassword,
                role: "author",
            },
        });

        const author = await prisma.author.upsert({
            where: { authorCode: rawAuthor.author_id },
            update: {},
            create: {
                authorCode: rawAuthor.author_id,
                name: rawAuthor.name,
                phone: rawAuthor.phone,
                city: rawAuthor.city,
                joinedDate: new Date(rawAuthor.joined_date),
                userId: user.id,
            },
        });

        for (const rawBook of rawAuthor.books) {
            await prisma.book.upsert({
                where: { bookCode: rawBook.book_id },
                update: {},
                create: {
                    bookCode: rawBook.book_id,
                    title: rawBook.title,
                    isbn: rawBook.isbn,
                    genre: rawBook.genre,
                    publicationDate: rawBook.publication_date
                        ? new Date(rawBook.publication_date)
                        : null,
                    status: rawBook.status,
                    mrp: rawBook.mrp,
                    authorRoyaltyPerCopy: rawBook.author_royalty_per_copy,
                    totalCopiesSold: rawBook.total_copies_sold,
                    totalRoyaltyEarned: rawBook.total_royalty_earned,
                    royaltyPaid: rawBook.royalty_paid,
                    royaltyPending: rawBook.royalty_pending,
                    lastRoyaltyPayoutDate: rawBook.last_royalty_payout_date
                        ? new Date(rawBook.last_royalty_payout_date)
                        : null,
                    printPartner: rawBook.print_partner,
                    availableOn: JSON.stringify(rawBook.available_on),
                    authorId: author.id,
                },
            });
        }

        console.log(`✅ ${rawAuthor.name} (${rawAuthor.email})`);
    }

    console.log("\n🎉 Seed complete!");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
