 type DockerEvent = {
  Type: string;
  Action: string;
  Actor: {
    ID: string;
    Attributes: {
      "com.docker.compose.config-hash": string;
      "com.docker.compose.container-number": string;
      "com.docker.compose.depends_on": string;
      "com.docker.compose.image": string;
      "com.docker.compose.oneoff": string;
      "com.docker.compose.project": string;
      "com.docker.compose.project.config_files": string;
      "com.docker.compose.project.working_dir": string;
      "com.docker.compose.service": string;
      "com.docker.compose.version": string;
      image: string;
      name: string;
      "org.opencontainers.image.ref.name": string;
      "org.opencontainers.image.version": string;
    };
  };
  scope: string;
  time: number;
  timeNano: number;
};

export type KubernetesPod = {
  kind: 'Pod';
  apiVersion: 'v1';

  metadata: {
    name: string;
    generateName?: string;
    namespace: string;
    uid: string;
    resourceVersion: string;
    generation: number;
    creationTimestamp: string;

    labels?: Record<string, string>;

    ownerReferences?: Array<{
      apiVersion: string;
      kind: string;
      name: string;
      uid: string;
      controller?: boolean;
      blockOwnerDeletion?: boolean;
    }>;

    managedFields?: any[];
  };

  spec: {
    volumes?: any[];

    containers: Array<{
      name: string;
      image: string;
      ports?: Array<{
        containerPort: number;
        protocol?: string;
      }>;
    }>;

    restartPolicy: 'Always' | 'OnFailure' | 'Never';
    terminationGracePeriodSeconds?: number;

    dnsPolicy?: 'ClusterFirst' | 'Default';

    serviceAccountName?: string;
    nodeName?: string;

    securityContext?: Record<string, any>;
    schedulerName?: string;

    tolerations?: Array<{
      key?: string;
      operator?: string;
      value?: string;
      effect?: string;
      tolerationSeconds?: number;
    }>;

    priority?: number;
    enableServiceLinks?: boolean;
    preemptionPolicy?: string;
  };

  status: {
    phase: 'Pending' | 'Running' | 'Succeeded' | 'Failed' | 'Unknown';

    conditions?: Array<{
      type: string;
      status: 'True' | 'False' | 'Unknown';
      lastProbeTime?: string;
      lastTransitionTime?: string;
    }>;

    hostIP?: string;
    hostIPs?: Array<{ ip: string }>;

    podIP?: string;
    podIPs?: Array<{ ip: string }>;

    startTime?: string;

    containerStatuses?: Array<{
      name: string;
      ready: boolean;
      restartCount: number;
      image: string;
      imageID: string;

      state?: {
        running?: {
          startedAt: string;
        };
        waiting?: {
          reason: string;
          message?: string;
        };
        terminated?: {
          exitCode: number;
          reason?: string;
          finishedAt?: string;
        };
      };
    }>;

    qosClass?: 'Guaranteed' | 'Burstable' | 'BestEffort';
  };
};

export default DockerEvent;