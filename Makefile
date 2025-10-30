NAME = transcendence

all:
	@mkdir -p /home/${USER}/data
	@mkdir -p /home/${USER}/data/backend
	@mkdir -p /home/${USER}/data/frontend
	@printf "Building and setting configuration for ${NAME}...\n"
	@docker-compose -f srcs/docker-compose.yml up -d --build

build:
	@printf "Building ${NAME} containers...\n"
	@docker-compose -f srcs/docker-compose.yml build

down:
	@printf "Stopping ${NAME}...\n"
	@docker-compose -f srcs/docker-compose.yml down

clean: down
	@printf "Stopping and cleaning up all docker configurations of ${NAME}...\n"
	@docker system prune -a

fclean:
	@printf "Cleaning all configuration of ${NAME} and both volumes and host data...\n"
	@if [ -n "$$(docker ps -qa)" ]; then docker stop $$(docker ps -qa); fi
	@docker system prune --all --force --volumes
	@docker network prune --force
	@docker volume prune --force
	@docker image prune --all --force
	@docker container prune --force
	@docker builder prune --all --force
	@if [ -n "$$(docker volume ls -q)" ]; then docker volume rm $$(docker volume ls -q); fi
	@if [ -d "/home/${USER}/data" ]; then sudo rm -rf /home/${USER}/data; fi

re: clean all

logs:
	@printf "Following logs for ${NAME}...\n"
	@docker-compose -f srcs/docker-compose.yml logs -f

status:
	@printf "Status of ${NAME} containers:\n"
	@docker-compose -f srcs/docker-compose.yml ps

restart:
	@printf "Restarting ${NAME}...\n"
	@docker-compose -f srcs/docker-compose.yml restart



.PHONY: all build down clean fclean re logs status restart
