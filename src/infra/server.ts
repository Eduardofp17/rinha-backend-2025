import Fastify from "fastify";
import { ENVIRONMENT } from "../config/environment";
import { registerRoutes } from "./routes";

const server = Fastify({logger: true});


(async function start() {
  await server.register(registerRoutes);
  await server.listen({port: Number(ENVIRONMENT.APP_PORT), host: '0.0.0.0'});
})();