import { createMcpHandler } from "mcp-handler";
import { z } from "zod";

const handler = createMcpHandler(
  (server) => {
    // Health check tool
    server.tool(
      "ping",
      "Simple health check",
      {},
      async () => ({ content: [{ type: "text", text: "pong" }] })
    );

    // List Vercel projects
    server.tool(
      "vercel_list_projects",
      "Lista proyectos de Vercel para el usuario/token actual",
      {
        limit: z.number().int().min(1).max(100).optional().describe("Cantidad de proyectos a devolver (default 20)"),
      },
      async ({ limit }) => {
        const token = process.env.VERCEL_ACCESS_TOKEN;
        if (!token) {
          throw new Error("VERCEL_ACCESS_TOKEN no está configurado");
        }
        const url = new URL("https://api.vercel.com/v9/projects");
        if (limit) url.searchParams.set("limit", String(limit));
        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Error Vercel API (${res.status}): ${text}`);
        }
        const data = await res.json();
        return {
          content: [
            { type: "text", text: JSON.stringify(data, null, 2) },
          ],
        };
      }
    );

    // Get a single Vercel project
    server.tool(
      "vercel_get_project",
      "Obtiene un proyecto de Vercel por ID o nombre",
      {
        idOrName: z.string().min(1).describe("ID del proyecto (p. ej. prj_...) o nombre"),
      },
      async ({ idOrName }) => {
        const token = process.env.VERCEL_ACCESS_TOKEN;
        if (!token) {
          throw new Error("VERCEL_ACCESS_TOKEN no está configurado");
        }
        const res = await fetch(`https://api.vercel.com/v10/projects/${encodeURIComponent(idOrName)}`,
          {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
          }
        );
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Error Vercel API (${res.status}): ${text}`);
        }
        const data = await res.json();
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      }
    );

    // List environment variables for a project
    server.tool(
      "vercel_list_envs",
      "Lista variables de entorno del proyecto de Vercel (todas las targets)",
      {
        projectIdOrName: z.string().min(1).describe("ID del proyecto (prj_...) o nombre"),
      },
      async ({ projectIdOrName }) => {
        const token = process.env.VERCEL_ACCESS_TOKEN;
        if (!token) throw new Error("VERCEL_ACCESS_TOKEN no está configurado");
        const res = await fetch(`https://api.vercel.com/v9/projects/${encodeURIComponent(projectIdOrName)}/env`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Error Vercel API (${res.status}): ${text}`);
        }
        const data = await res.json();
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      }
    );

    // Create or update a specific env var for target(s)
    server.tool(
      "vercel_set_env",
      "Crea o actualiza una variable de entorno en Vercel para un proyecto y target dado",
      {
        projectIdOrName: z.string().min(1).describe("ID del proyecto (prj_...) o nombre"),
        key: z.string().min(1),
        value: z.string().min(1),
        target: z.enum(["production", "preview", "development"]).default("production"),
      },
      async ({ projectIdOrName, key, value, target }) => {
        const token = process.env.VERCEL_ACCESS_TOKEN;
        if (!token) throw new Error("VERCEL_ACCESS_TOKEN no está configurado");

        // First list envs to see if it exists for target
        const listRes = await fetch(`https://api.vercel.com/v9/projects/${encodeURIComponent(projectIdOrName)}/env`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        if (!listRes.ok) {
          const text = await listRes.text();
          throw new Error(`Error list envs (${listRes.status}): ${text}`);
        }
        const listData: any = await listRes.json();
        const envs: any[] = listData.envs ?? [];
        const existing = envs.find((e: any) => e.key === key && Array.isArray(e.target) ? e.target.includes(target) : e.target === target);

        if (existing && existing.id) {
          // Update existing
          const patchRes = await fetch(`https://api.vercel.com/v9/projects/${encodeURIComponent(projectIdOrName)}/env/${existing.id}`, {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ value, target }),
          });
          if (!patchRes.ok) {
            const text = await patchRes.text();
            throw new Error(`Error update env (${patchRes.status}): ${text}`);
          }
          const data = await patchRes.json();
          return { content: [{ type: "text", text: JSON.stringify({ action: "updated", key, target, result: data }, null, 2) }] };
        } else {
          // Create new
          const createRes = await fetch(`https://api.vercel.com/v9/projects/${encodeURIComponent(projectIdOrName)}/env`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ key, value, target: [target], type: "encrypted" }),
          });
          if (!createRes.ok) {
            const text = await createRes.text();
            throw new Error(`Error create env (${createRes.status}): ${text}`);
          }
          const data = await createRes.json();
          return { content: [{ type: "text", text: JSON.stringify({ action: "created", key, target, result: data }, null, 2) }] };
        }
      }
    );

    // Redeploy last deployment of a project
    server.tool(
      "vercel_redeploy",
      "Lanza un redeploy del último deployment del proyecto",
      {
        projectIdOrName: z.string().min(1).describe("ID del proyecto (prj_...) o nombre"),
      },
      async ({ projectIdOrName }) => {
        const token = process.env.VERCEL_ACCESS_TOKEN;
        if (!token) throw new Error("VERCEL_ACCESS_TOKEN no está configurado");

        // Get last deployment
        const depRes = await fetch(`https://api.vercel.com/v6/deployments?projectId=${encodeURIComponent(projectIdOrName)}&limit=1`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        if (!depRes.ok) {
          const text = await depRes.text();
          throw new Error(`Error list deployments (${depRes.status}): ${text}`);
        }
        const depData: any = await depRes.json();
        const last = depData.deployments?.[0];
        if (!last?.uid) {
          throw new Error("No se encontró el último deployment para redeploy");
        }

        const redeployRes = await fetch(`https://api.vercel.com/v13/deployments/${last.uid}/redeploy`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!redeployRes.ok) {
          const text = await redeployRes.text();
          throw new Error(`Error redeploy (${redeployRes.status}): ${text}`);
        }
        const data = await redeployRes.json();
        return { content: [{ type: "text", text: JSON.stringify({ action: "redeploy", deployment: last.uid, result: data }, null, 2) }] };
      }
    );
  },
  // Optional server options
  {},
  // Optional runtime options
  {
    basePath: "/api",
    verboseLogs: true,
    maxDuration: 60,
  }
);

export { handler as GET, handler as POST };
