declare module "fastify" {
  interface FastifyReply {
    accessSign(payload: object, options?: object): Promise<string>;
    refreshSign(payload: object, options?: object): Promise<string>;
  }
  interface FastifyRequest {
    accessVerify(options?: object): Promise<void>;
    refreshVerify(options?: object): Promise<void>;
  }
}

export {};