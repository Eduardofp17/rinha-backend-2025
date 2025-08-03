import type {FastifyRequest, FastifyReply} from 'fastify';
import type { PaymentRequest } from '../domain/payment';
import {validate} from 'uuid';
import {queue, redis} from '../infra/queue';

export const paymentHandler = async (req: FastifyRequest<PaymentRequest>, rep: FastifyReply) => {
  const {correlationId, amount} = req.body;
  if(!correlationId || !amount || !validate(correlationId) || amount <= 0) return rep.status(400).send();
   const exists = await redis.hexists('payments-correlationIds', correlationId);
   if (exists) { 
    return rep.status(202).send();
   }

  const priority = amount > 1000 ? 1 : amount > 100 ? 2 : 3;

  await redis.hset('payments-correlationIds', correlationId, 'processing');

  queue.add("payment",{correlationId, amount: Math.round(amount * 100)}, {
        priority,
    delay: 0,
  });

  return rep.status(202).send();
}