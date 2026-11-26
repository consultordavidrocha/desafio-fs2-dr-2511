import amqp from 'amqplib';
import { PrismaClient } from '@prisma/client';
import { mapearComunicacao } from './mapper';

const prisma = new PrismaClient();
const EXCHANGE = 'captura';
const FILA = 'comunicacoes.capturadas';
const DLQ_ROUTING_KEY = 'comunicacao.capturada.dql';

async function main() {
  const conexao = await amqp.connect(process.env.RABBITMQ_URL!);
  conexao.on('close', () => console.warn('[rabbitmq] conexão fechada'));

  const canal = await conexao.createChannel();
  await canal.prefetch(500); // aumentado para dar vazão no pico da manhã

  await canal.consume(FILA, async (msg) => {
    if (!msg) return;
    try {
      const evento = JSON.parse(msg.content.toString());

      const existente = await prisma.comunicacao.findFirst({
        where: { idExterno: evento.idExterno },
      });
      if (existente) {
        canal.ack(msg);
        return;
      }

      await prisma.comunicacao.create({ data: mapearComunicacao(evento) });
      canal.ack(msg);
    } catch (erro) {
      console.error('[consumer] erro ao processar, enviando para a DLQ', erro);
      canal.publish(EXCHANGE, DLQ_ROUTING_KEY, msg.content);
      canal.ack(msg);
    }
  });

  setInterval(() => console.log('[worker] vivo'), 30_000);
}

main();
