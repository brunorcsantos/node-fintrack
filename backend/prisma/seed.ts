// prisma/seed.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Aceita e-mail como argumento: npx tsx prisma/seed.ts meu@email.com
  const emailArg = process.argv[2];

  const user = emailArg
    ? await prisma.user.findUnique({ where: { email: emailArg } })
    : await prisma.user.findFirst();

  if (!user) {
    console.error(emailArg
      ? `❌ Usuário com e-mail '${emailArg}' não encontrado.`
      : "❌ Nenhum usuário encontrado. Crie uma conta primeiro."
    );
    process.exit(1);
  }

  console.log(`✅ Usuário encontrado: ${user.email}`);

  // Busca as categorias do usuário
  const categories = await prisma.category.findMany({
    where: { userId: user.id },
    include: { subcategories: true },
  });

  if (categories.length === 0) {
    console.error("❌ Nenhuma categoria encontrada para este usuário.");
    process.exit(1);
  }

  console.log(`✅ ${categories.length} categorias encontradas`);

  // Mapeia slug → id para facilitar o seed
  const catMap: Record<string, string> = {};
  const subMap: Record<string, string> = {};

  categories.forEach((cat) => {
    catMap[cat.slug] = cat.id;
    cat.subcategories.forEach((sub) => {
      subMap[sub.slug] = sub.id;
    });
  });

  // Dados mockados
  const transactions = [
    // Março 2026
    { description: "Aluguel Março",            amount: 2000, type: "expense", date: "2026-03-01", catSlug: "moradia",     subSlug: "aluguel" },
    { description: "Conta de Energia",          amount: 185,  type: "expense", date: "2026-03-05", catSlug: "moradia",     subSlug: "energia" },
    { description: "Supermercado Pão de Açúcar",amount: 420,  type: "expense", date: "2026-03-03", catSlug: "alimentacao", subSlug: "supermercado" },
    { description: "iFood - Jantar",            amount: 87,   type: "expense", date: "2026-03-04", catSlug: "alimentacao", subSlug: "delivery" },
    { description: "Combustível Shell",         amount: 280,  type: "expense", date: "2026-03-02", catSlug: "transporte",  subSlug: "combustivel" },
    { description: "Plano de Saúde",            amount: 290,  type: "expense", date: "2026-03-01", catSlug: "saude",       subSlug: "plano_saude" },
    { description: "Netflix + Spotify",         amount: 75,   type: "expense", date: "2026-03-01", catSlug: "lazer",       subSlug: "streaming" },
    { description: "Fatura Nubank",             amount: 1200, type: "expense", date: "2026-03-10", catSlug: "cartao",      subSlug: "fatura" },
    { description: "Salário",                   amount: 8500, type: "income",  date: "2026-03-05", catSlug: "receita",     subSlug: "salario" },
    { description: "Restaurante Dom",           amount: 180,  type: "expense", date: "2026-03-07", catSlug: "alimentacao", subSlug: "restaurante" },
    { description: "Academia",                  amount: 90,   type: "expense", date: "2026-03-01", catSlug: "saude",       subSlug: "academia" },
    { description: "Uber - trabalho",           amount: 45,   type: "expense", date: "2026-03-06", catSlug: "transporte",  subSlug: "uber" },
    { description: "Cinema com a família",      amount: 120,  type: "expense", date: "2026-03-08", catSlug: "lazer",       subSlug: "cinema" },
    { description: "Freelance design",          amount: 1200, type: "income",  date: "2026-03-10", catSlug: "receita",     subSlug: "freelance" },
    { description: "Padaria do bairro",         amount: 55,   type: "expense", date: "2026-03-09", catSlug: "alimentacao", subSlug: "padaria" },
    // Fevereiro 2026
    { description: "Aluguel Fevereiro",         amount: 2000, type: "expense", date: "2026-02-01", catSlug: "moradia",     subSlug: "aluguel" },
    { description: "Salário Fevereiro",         amount: 8500, type: "income",  date: "2026-02-05", catSlug: "receita",     subSlug: "salario" },
    { description: "Supermercado",              amount: 510,  type: "expense", date: "2026-02-10", catSlug: "alimentacao", subSlug: "supermercado" },
    { description: "Combustível",               amount: 310,  type: "expense", date: "2026-02-15", catSlug: "transporte",  subSlug: "combustivel" },
    { description: "Conta energia",             amount: 210,  type: "expense", date: "2026-02-05", catSlug: "moradia",     subSlug: "energia" },
  ];

  let created = 0;
  let skipped = 0;

  for (const tx of transactions) {
    const categoryId = catMap[tx.catSlug];
    const subcategoryId = subMap[tx.subSlug];

    if (!categoryId) {
      console.warn(`⚠ Categoria não encontrada: ${tx.catSlug}`);
      skipped++;
      continue;
    }

    await prisma.transaction.create({
      data: {
        description: tx.description,
        amount: tx.amount,
        type: tx.type as "income" | "expense",
        date: new Date(tx.date + "T12:00:00"),
        userId: user.id,
        categoryId,
        subcategoryId: subcategoryId || undefined,
      },
    });
    created++;
  }

  // Seed de orçamentos
  const budgets = [
    { catSlug: "moradia",     amount: 3000 },
    { catSlug: "alimentacao", amount: 1500 },
    { catSlug: "transporte",  amount: 800  },
    { catSlug: "saude",       amount: 600  },
    { catSlug: "lazer",       amount: 500  },
    { catSlug: "cartao",      amount: 2000 },
  ];

  for (const b of budgets) {
    const categoryId = catMap[b.catSlug];
    if (!categoryId) continue;

    // Prisma não aceita null em chaves únicas compostas — usa deleteMany + create
    await prisma.budget.deleteMany({
      where: { userId: user.id, categoryId, subcategoryId: null, month: "2026-03" },
    });

    await prisma.budget.create({
      data: {
        userId: user.id,
        categoryId,
        amount: b.amount,
        month: "2026-03",
      },
    });
  }

  console.log(`\n✅ Seed concluído!`);
  console.log(`   📝 ${created} transações criadas`);
  console.log(`   ⚠  ${skipped} transações ignoradas`);
  console.log(`   🎯 ${budgets.length} orçamentos criados`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());