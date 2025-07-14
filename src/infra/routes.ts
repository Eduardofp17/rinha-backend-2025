import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { paymentHandler } from '../handlers/payment-handler';
import {getSummary} from '../services/summary-service';


export async function registerRoutes(fastify: FastifyInstance) {

  fastify.post('/payments', paymentHandler); 

  fastify.get('/payments-summary', async (req: FastifyRequest<{ Querystring: { from?: string; to?: string } }>, rep) => {
    const { from, to } = req.query;

    const res = await getSummary(from, to);

    return rep.status(200).send(res);
  });
}