FROM node:20-alpine AS build

# Le contexte Docker de ce build est app/ (cf. openshift/quantum-frontend-buildconfig.yaml
# contextDir: app), donc .git (à la racine du dépôt) n'est pas accessible ici et
# vite.config.ts ne peut pas déduire le commit buildé tout seul (cf. lib/buildInfo.ts,
# affiché dans l'UI HPC).
#
# Sur un build OpenShift, OPENSHIFT_BUILD_COMMIT est un build-arg injecté
# automatiquement par le contrôleur de build (stratégie Docker) — pas besoin
# de le passer explicitement. C'est utilisé par défaut pour le hash. Non
# vérifié en conditions réelles faute d'accès à un cluster depuis cet
# environnement : si ça ne se déclenche pas comme prévu, GIT_COMMIT reste
# disponible en repli manuel, sans rien casser (juste "unknown" comme avant).
# Il n'y a pas d'équivalent automatique pour la date du commit ; sans
# GIT_COMMIT_DATE explicite, elle reste "unknown" (la date de build, elle,
# est toujours renseignée : cf. vite.config.ts, buildDate ne dépend d'aucun
# de ces arguments).
#   oc start-build quantum-maxcut-frontend \
#     --build-arg=GIT_COMMIT=$(git rev-parse --short=12 HEAD) \
#     --build-arg=GIT_COMMIT_DATE=$(git log -1 --format=%cI)
# (en dev local ou sur le build GitHub Pages, .git est présent : ces build-args sont
# inutiles, vite.config.ts lit directement git.)
ARG GIT_COMMIT=""
ARG GIT_COMMIT_DATE=""
ARG OPENSHIFT_BUILD_COMMIT=""

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN VITE_COMMIT_HASH="${GIT_COMMIT:-$OPENSHIFT_BUILD_COMMIT}" VITE_COMMIT_DATE="$GIT_COMMIT_DATE" \
    npm run build -- --base /

FROM nginxinc/nginx-unprivileged:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
