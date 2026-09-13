import { defineRailway, github, postgres, preserve, project, service, volume } from "railway/iac";

export default defineRailway(() => {
  const PostgresQ_T = postgres("Postgres-q_-T", { region: "sfo" });
  PostgresQ_T.networking = { privateNetworkEndpoint: "postgres-q-t" };
  const Postgres = postgres("Postgres", { region: "sfo" });
  Postgres.networking = { privateNetworkEndpoint: "postgres" };
  const postgresVolumeTeCd = volume("postgres-volume-TeCd", { alerts: { usage: { "100": {}, "80": {}, "95": {} } }, allowOnlineResize: true, region: "sfo", sizeMB: 500 });
  const postgresVolume = volume("postgres-volume", { alerts: { usage: { "100": {}, "80": {}, "95": {} } }, allowOnlineResize: true, region: "sfo", sizeMB: 500 });
  const viswahBackendApi = service("viswah-backend-api", {
    source: github("akarapuswapanth98-netizen/viswah", { rootDirectory: "backend" }),
    start: "sh -c 'python -m uvicorn main:app --host 0.0.0.0 --port \"$PORT\"'",
    build: { builder: "DOCKERFILE", dockerfilePath: "Dockerfile" },
    replicas: { "sfo": 1 },
    env: { CORS_ORIGINS: preserve(), DATABASE_URL: preserve(), JWT_SECRET_KEY: preserve() },
  });

  return project("viswah-backend", {
    resources: [PostgresQ_T, viswahBackendApi, Postgres, postgresVolumeTeCd, postgresVolume],
  });
});
