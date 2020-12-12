import { serve } from "https://deno.land/std@0.80.0/http/server.ts";
import * as path from "https://deno.land/std@0.80.0/path/mod.ts";

const INDEX = "index.html";
const PORT = Deno.env.get("PORT") || 3000;
const server = serve({ port: PORT });

console.log(`Listening on port localhost:${PORT}...`);

for await (const req of server) {
  console.log("Request: ", req.url);

  const { dir, base } = path.parse(req.url);
  const pathname = dir + base;
  const file = req.url.endsWith("/") ? `.${pathname}${INDEX}` : `.${pathname}`;

  try {
    const data = await Deno.readTextFile(file);
    req.respond({ body: data });
  } catch (error) {
    req.respond({ body: "Not found" });
  }
}
