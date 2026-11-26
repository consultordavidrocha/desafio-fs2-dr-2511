/**
 * Carrega dados/tribunais.json e dados/comunicacoes.json no banco.
 *
 * - Idempotente: pode rodar a cada subida do container sem duplicar nada.
 * - Em lotes: não segura o arquivo inteiro numa única transação.
 * - Registros inválidos são pulados e contados, com o motivo, no log.
 *
 * Também cria (ou atualiza) a conta de demonstração — ver demo-user.ts.
 *
 * Uso: npm run seed (após o build) | npm run seed:dev (direto do TypeScript)
 * Pasta dos dados: SEED_DATA_DIR (padrão: ../dados, a partir de api/).
 */
import { PrismaClient } from '@prisma/client';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  mapCommunication,
  mapCourt,
  MappedCommunication,
  unwrapList,
} from './cnj-mapper';
import type {
  CnjCommunicationSource,
  CnjCourtSource,
  CnjListFile,
} from './cnj-source.types';
import { seedDemoUser } from './demo-user';

const BATCH_SIZE = 500;
const prisma = new PrismaClient();

function readJson<T>(path: string): T[] | null {
  if (!existsSync(path)) return null;
  return unwrapList(JSON.parse(readFileSync(path, 'utf-8')) as CnjListFile<T>);
}

async function seedCourts(sources: CnjCourtSource[]): Promise<number> {
  const courts = sources.map(mapCourt).filter((c) => c !== null);
  for (const court of courts) {
    await prisma.court.upsert({
      where: { acronym: court.acronym },
      create: court,
      update: { name: court.name },
    });
  }
  return courts.length;
}

/** Grava um lote: substitui as comunicações do lote (e seus destinatários). */
async function saveBatch(batch: MappedCommunication[]): Promise<void> {
  const ids = batch.map((c) => c.id);
  await prisma.$transaction([
    // Tribunais citados mas ausentes de tribunais.json: cria com a sigla como nome.
    prisma.court.createMany({
      data: batch.map((c) => ({
        acronym: c.courtAcronym,
        name: c.courtAcronym,
      })),
      skipDuplicates: true,
    }),
    prisma.lawsuit.createMany({
      data: batch.map((c) => ({
        number: c.lawsuitNumber,
        className: c.lawsuitClass,
        courtAcronym: c.courtAcronym,
      })),
      skipDuplicates: true,
    }),
    // Apagar e recriar (cascade nos destinatários) mantém o seed idempotente.
    prisma.communication.deleteMany({ where: { id: { in: ids } } }),
    prisma.communication.createMany({
      data: batch.map((c) => ({
        id: c.id,
        lawsuitNumber: c.lawsuitNumber,
        courtAcronym: c.courtAcronym,
        availabilityDate: c.availabilityDate,
        type: c.type,
        documentType: c.documentType,
        courtUnit: c.courtUnit,
        content: c.content,
        link: c.link,
      })),
    }),
    prisma.recipient.createMany({
      data: batch.flatMap((c) =>
        c.recipients.map((r) => ({ ...r, communicationId: c.id })),
      ),
    }),
  ]);
}

async function seedCommunications(sources: CnjCommunicationSource[]): Promise<{
  saved: number;
  duplicated: number;
  rejected: Map<string, number>;
}> {
  const rejected = new Map<string, number>();
  const byId = new Map<number, MappedCommunication>();
  let duplicated = 0;

  for (const src of sources) {
    const result = mapCommunication(src);
    if (!result.ok) {
      rejected.set(result.reason, (rejected.get(result.reason) ?? 0) + 1);
      continue;
    }
    // id repetido no arquivo: vale a última ocorrência.
    if (byId.has(result.value.id)) duplicated++;
    byId.set(result.value.id, result.value);
  }

  const valid = [...byId.values()];
  for (let i = 0; i < valid.length; i += BATCH_SIZE) {
    await saveBatch(valid.slice(i, i + BATCH_SIZE));
  }
  return { saved: valid.length, duplicated, rejected };
}

async function main(): Promise<void> {
  const dataDir = resolve(
    process.env.SEED_DATA_DIR ?? resolve(__dirname, '../../../../dados'),
  );
  const courts = readJson<CnjCourtSource>(resolve(dataDir, 'tribunais.json'));
  const communications = readJson<CnjCommunicationSource>(
    resolve(dataDir, 'comunicacoes.json'),
  );

  const demoEmail = await seedDemoUser(prisma);
  if (demoEmail) console.log(`[seed] Usuário de demonstração: ${demoEmail}`);

  if (!courts && !communications) {
    console.warn(
      `[seed] Nenhum arquivo encontrado em ${dataDir}; nada a carregar.`,
    );
    return;
  }

  if (courts) console.log(`[seed] Tribunais: ${await seedCourts(courts)}`);
  if (communications) {
    const { saved, duplicated, rejected } =
      await seedCommunications(communications);
    console.log(
      `[seed] Comunicações gravadas: ${saved} de ${communications.length}`,
    );
    if (duplicated) {
      console.warn(`[seed] Ids repetidos (mantida a última): ${duplicated}`);
    }
    for (const [reason, count] of rejected) {
      console.warn(`[seed] Rejeitadas (${reason}): ${count}`);
    }
  }
}

main()
  .catch((error) => {
    console.error('[seed] Falhou:', error);
    process.exitCode = 1;
  })
  .finally(() => void prisma.$disconnect());
