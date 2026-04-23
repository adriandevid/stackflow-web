
import Home from "@pedreiro-web/components/home";
import { localdatabase } from "@pedreiro-web/infrastructure/database/config";
import { Edge } from "@pedreiro-web/infrastructure/repository/types";
import { Application } from "@pedreiro-web/infrastructure/repository/types/application";
import { InfrastructureComponent, InfrastructureComponentCommand, InfrastructureComponentEnvironment, InfrastructureComponentLabel, InfrastructureComponentNetwork, InfrastructureComponentPort, InfrastructureComponentVolume } from "@pedreiro-web/infrastructure/repository/types/infrastructure-component";
import { MemoryInformations } from "@pedreiro-web/util/plataform";

export const revalidate = 0;

export default async function App() {
  const edges = localdatabase.prepare(`select * from edges`).all()
  const edgesResult: Edge[] = edges as Edge[];


  const applications = localdatabase.prepare(`select * from application`).all()
  const applicationsResult: Application[] = applications as Application[];

  const infrastructureComponents = localdatabase.prepare(`select * from infrastructure_component`).all() as InfrastructureComponent[];
  infrastructureComponents.forEach(infrastructureComponent => {
    infrastructureComponent.commands = localdatabase.prepare(`select * from infrastructure_component_command where infrastructure_component_id = ${infrastructureComponent.id}`).all() as InfrastructureComponentCommand[];
    infrastructureComponent.ports = localdatabase.prepare(`select * from infrastructure_component_port where infrastructure_component_id = ${infrastructureComponent.id}`).all() as InfrastructureComponentPort[];
    infrastructureComponent.volumes = localdatabase.prepare(`select * from infrastructure_component_volumes where infrastructure_component_id = ${infrastructureComponent.id}`).all() as InfrastructureComponentVolume[];
    infrastructureComponent.networks = localdatabase.prepare(`select * from infrastructure_component_network where infrastructure_component_id = ${infrastructureComponent.id}`).all() as InfrastructureComponentNetwork[];
    infrastructureComponent.labels = localdatabase.prepare(`select * from infrastructure_component_labels where infrastructure_component_id = ${infrastructureComponent.id}`).all() as InfrastructureComponentLabel[];
    infrastructureComponent.environments = localdatabase.prepare(`select * from infrastructure_component_environment where infrastructure_component_id = ${infrastructureComponent.id}`).all() as InfrastructureComponentEnvironment[];
  })

  var memory: MemoryInformations = { size: 0 };
  
  // if(platform== "win32") {
  //   memory = await getLocalMemoryInformations();
  // } 
  // else {
  //   memory = await getLocalMemoryInformationsLinux();
  // }

  return (<Home computerMemory={memory} edgesSource={edgesResult} applicationsSource={applicationsResult} infrastructureComponentsSource={infrastructureComponents}></Home>)
}
