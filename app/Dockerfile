FROM node:20-alpine AS build

# Le contexte Docker de ce build est app/ (cf. openshift/quantum-frontend-buildconfig.yaml
# contextDir: app), donc .git (à la racine du dépôt) n'est pas accessible ici et
# vite.config.ts ne peut pas déduire le commit buildé tout seul (cf. lib/buildInfo.ts,
# affiché dans l'UI HPC). Pour que ce soit renseigné plutôt que "unknown" sur un build
# OpenShift, déclencher le build avec ces build-args, ex :
#   oc start-build quantum-maxcut-frontend \
#     --build-arg=GIT_COMMIT=$(git rev-parse --short=12 HEAD) \
#     --build-arg=GIT_COMMIT_DATE=$(git log -1 --format=%cI)
# (en dev local ou sur le build GitHub Pages, .git est présent : ces build-args sont
# inutiles, vite.config.ts lit directement git.)
ARG GIT_COMMIT=""
ARG GIT_COMMIT_DATE=""
ENV VITE_COMMIT_HASH=$GIT_COMMIT
ENV VITE_COMMIT_DATE=$GIT_COMMIT_DATE

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build -- --base /

FROM nginxinc/nginx-unprivileged:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
