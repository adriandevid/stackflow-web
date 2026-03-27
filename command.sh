#!/bin/bash

validateDependenciesOfSoftware() {
        DOCKER_ENABLED=`systemctl is-enabled containerd`
        if [ "$DOCKER_ENABLED" = "enabled" ]
        then
                echo "docker enabled"
                KUBELET_ENABLED=`systemctl is-enabled kubelet`

                if [ "$KUBELET_ENABLED" = "enabled" ]
                then
                        echo "kubelet enabled"
                else
                        echo "kubelet disabled"
                fi
        else
                echo "docker disabled"
                echo "kubelet disabled"
        fi
        echo ""
}

printInformations() {
        clear
        echo " == Pedreiro Web =="
        echo " * Bem vindo ao sistema de instalação do pedreiro cloud para o gerenciamento de documentos yml."
        echo " * As principais funcionalidades exigem o docker e kubernetes devidamente configurado."
        echo ""
        echo " * commandos: "
        echo " *** start: Inicia a interface levando em consideração que o ambiente esta devidamente configurado"
        echo " *** stop: Para a execução do projeto"
        echo " *** validate: Valida o status dos componentes necessários para execução."
        echo ""
}

start() {
        sudo npm install pm2@latest -g
        sudo env "PATH=$PATH" pm2 start
}

install() {
        sudo rm -rf /opt/pw
        sudo mkdir /opt/pw
        sudo git clone https://github.com/adriandevid/pedreiro-web.git /opt/pw
}


COMMANDS=("start" "stop" "validate")
COMMAND_FOUND=false
INPUT_COMMAND="$1"

for element in "${COMMANDS[@]}"; do
        if [[ "$element" = "$1" ]]; then
                COMMAND_FOUND=true
                break
        fi
done

if [ "$COMMAND_FOUND" == true ]
then
        echo ""
        [ "$INPUT_COMMAND" = "validate" ] && \
                validateDependenciesOfSoftware
        [ "$INPUT_COMMAND" = "start" ] && \
                start
else
        printInformations
        echo ""
        echo "Insira um comando: "
        while read INPUT_COMMAND
        do
                case $INPUT_COMMAND in
                        start) start;;
                        stop) echo "stop" ;;
                        validate) validateDependenciesOfSoftware ;;
                        *) echo "commando não encontrado"
                esac
        done
        #read INPUT_COMMAND # start, stop
fi