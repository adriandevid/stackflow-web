import { z } from 'zod';

export type Application = {
  id?: number | undefined
  name: string

  // service
  port: string
  node_port: string
  target_port: string
  protocol?: string        // default 'TCP'
  type?: string            // default 'NodePort'

  // deployment
  container_name: string
  image: string
  image_pull_policy?: string | null | undefined
  image_pull_secrets?: string | undefined
  replicas: string         // default 1
  configuration_id: number
  build_date?: Date | undefined
  position_x: number
  position_y: number
  files: ApplicationFile[]
  alive: boolean
}

export type ApplicationFile = {
  id: number
  name: string
  file: string
  application_id: number
}

export const ApplicationFileValidator = z.object({
  id: z.number().optional().nullable(),
  name: z.string(),
  file: z.string(),
  application_id: z.number().optional()
});

export type ApplicationFileUpdate = z.infer<typeof ApplicationFileValidator>;
export type ApplicationUpdate = z.infer<typeof ApplicationValidator> & {
  files?: ApplicationFileUpdate[] | undefined
}

export const ApplicationValidator = z.object({
  id: z.number().optional(),
  name: z.string().min(1, { message: "Preencha o campo."}),
  port: z.string().regex(new RegExp("\\d", "g"), { message: "Preencha o campo."}),
  node_port:  z.string().regex(new RegExp("\\d", "g"), { message: "Preencha o campo."}),
  target_port:  z.string().regex(new RegExp("\\d", "g"), { message: "Preencha o campo."}),
  protocol:  z.string().optional(), // default 'TCP'
  type:  z.string().optional(),     // default 'NodePort'
  // deployment
  container_name: z.string({ message: "Preencha o campo."}),
  image: z.string({ message: "Preencha o campo."}).min(1, { message: "Preencha o campo."}),
  image_pull_policy: z.string().optional().nullable(),
  image_pull_secret: z.string().optional(),
  replicas: z.string().regex(new RegExp("\\d", "g"), { message: "Preencha o campo."}),         // default 1
  configuration_id: z.number().optional(),
  files: z.array(ApplicationFileValidator),
  position_x: z.number(),
  position_y: z.number()
});



export type ApplicationFileCreate = z.infer<typeof ApplicationFileValidator>
export type ApplicationCreate = z.infer<typeof ApplicationValidator> & {
  files?: ApplicationFileCreate[] | undefined
}

