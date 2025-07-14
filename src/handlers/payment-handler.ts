import type {FastifyRequest, FastifyReply} from 'fastify';
import type { PaymentRequest } from '../domain/payment';
import {validate} from 'uuid';
import {queue} from '../infra/queue';

export const paymentHandler = async (req: FastifyRequest<PaymentRequest>, rep: FastifyReply) => {
  const {correlationId, amount} = req.body;
  
  if(!correlationId || !amount || !validate(correlationId) || amount <= 0) return rep.status(400).send();
  const priority = amount > 1000 ? 1 : amount > 100 ? 2 : 3;

  await queue.add("payment",{correlationId, amount: Number(amount)}, {
        priority,
    delay: 0,
  });

  return rep.status(202).send();
}