
import { z } from 'zod';

export type Log = { resource: string, log: string, time: number, short_log: string };

export type InfrastructureComponent = {
  id: number
  service_key: string
  type: string
  image: string
  container_name: string
  entrypoint?: string | null | undefined
  command?: string | null | undefined
  restart?: string | undefined          // default 'always'
  configuration_id: number
  position_x: number
  position_y: number
  commands: InfrastructureComponentCommand[]
  ports: InfrastructureComponentPort[]
  volumes: InfrastructureComponentVolume[]
  networks: InfrastructureComponentNetwork[]
  labels: InfrastructureComponentLabel[]
  environments: InfrastructureComponentEnvironment[]
  logs: Log[]
  alive: boolean,
  files: InfrastructureComponentFile[]
}

export type InfrastructureComponentFile = {
  id: number;
  name: string,
  file: string,
  infrastructure_component_id?: number | undefined;
}

export const InfrastructureComponentFileValidator = z.object({
  id: z.number().optional().nullable(),
  name: z.string(),
  file: z.string(),
  infrastructure_component_id: z.number().optional()
});

export type InfrastructureComponentFileUpdate = z.infer<typeof InfrastructureComponentFileValidator>;

export type InfrastructureComponentCommand = {
  id: number
  command: string
  infrastructure_component_id: number
}

export const InfrastructureComponentCommandValidator = z.object({
  id: z.number().optional(),
  command: z.string().min(1, { message: "Preencha o campo." }),
  infrastructure_component_id: z.number().optional()
})
export type InfrastructureComponentCommandCreate = Omit<
  z.infer<typeof InfrastructureComponentCommandValidator>,
  "id"
>
export type InfrastructureComponentCommandUpdate = z.infer<typeof InfrastructureComponentCommandValidator>;


export type InfrastructureComponentPort = {
  id: number
  port_bind: string
  infrastructure_component_id: number
}

export const InfrastructureComponentPortValidator = z.object({
  id: z.number().optional(),
  port_bind: z.string().min(1, { message: "Preencha o campo." }),
  infrastructure_component_id: z.number().optional()
})
export type InfrastructureComponentPortCreate = Omit<
  z.infer<typeof InfrastructureComponentPortValidator>,
  "id"
>
export type InfrastructureComponentPortUpdate = z.infer<typeof InfrastructureComponentPortValidator>;

export type InfrastructureComponentVolume = {
  id: number
  volume: string
  infrastructure_component_id: number
}

export const InfrastructureComponentVolumeValidator = z.object({
  id: z.number().optional(),
  volume: z.string().min(1, { message: "Preencha o campo." }),
  infrastructure_component_id: z.number().optional()
})
export type InfrastructureComponentVolumeCreate = Omit<
  z.infer<typeof InfrastructureComponentVolumeValidator>,
  "id"
>
export type InfrastructureComponentVolumeUpdate = z.infer<typeof InfrastructureComponentVolumeValidator>;

export type InfrastructureComponentNetwork = {
  id: number
  network: string
  infrastructure_component_id: number
}

export const InfrastructureComponentNetworkValidator = z.object({
  id: z.number().optional(),
  network: z.string().min(1, { message: "Preencha o campo." }),
  infrastructure_component_id: z.number().optional()
})

export type InfrastructureComponentNetworkCreate = Omit<
  z.infer<typeof InfrastructureComponentNetworkValidator>,
  "id"
>

export type InfrastructureComponentNetworkUpdate = z.infer<typeof InfrastructureComponentNetworkValidator>;

export type InfrastructureComponentLabel = {
  id: number
  label: string
  infrastructure_component_id: number
}

export const InfrastructureComponentLabelValidator = z.object({
  id: z.number().optional(),
  label: z.string().min(1, { message: "Preencha o campo." }),
  infrastructure_component_id: z.number().optional()
})

export type InfrastructureComponentLabelCreate = Omit<
  z.infer<typeof InfrastructureComponentLabelValidator>,
  "id"
>

export type InfrastructureComponentLabelUpdate = z.infer<typeof InfrastructureComponentLabelValidator>;


export type InfrastructureComponentEnvironment = {
  id: number
  environment_name: string
  environment_value: string
  infrastructure_component_id: number
}

export const InfrastructureComponentEnvironmentValidator = z.object({
  id: z.number().optional(),
  environment_name:z.string().min(1, { message: "Preencha o campo." }),
  environment_value:z.string().min(1, { message: "Preencha o campo." }),
  infrastructure_component_id: z.number().optional()
})

export type InfrastructureComponentEnvironmentCreate = Omit<
  z.infer<typeof InfrastructureComponentEnvironmentValidator>,
  "id"
>

export type InfrastructureComponentEnvironmentUpdate = z.infer<typeof InfrastructureComponentEnvironmentValidator>;

export const InfrastructureComponentValidator = z.object({
  id: z.number().optional(),
  service_key: z.string(),
  type: z.string(),
  image: z.string().min(1, { message: "Preencha o campo." }),
  container_name: z.string(),
  entrypoint: z.string().optional().nullable(),
  command: z.string().optional().nullable(),
  restart: z.string().optional(),         // default 'always'
  configuration_id: z.number().optional(),
  position_x: z.number(),
  position_y: z.number(),
  commands: z.array(InfrastructureComponentCommandValidator),
  ports: z.array(InfrastructureComponentPortValidator),
  volumes: z.array(InfrastructureComponentVolumeValidator),
  networks: z.array(InfrastructureComponentNetworkValidator),
  labels: z.array(InfrastructureComponentLabelValidator),
  environments: z.array(InfrastructureComponentEnvironmentValidator),
  files: z.array(InfrastructureComponentFileValidator)
});


export type InfrastructureComponentCreate = Omit<
  z.infer<typeof InfrastructureComponentValidator>,
  "id"
>

export type InfrastructureComponentUpdate = z.infer<typeof InfrastructureComponentValidator>;