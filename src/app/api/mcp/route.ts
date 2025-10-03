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
