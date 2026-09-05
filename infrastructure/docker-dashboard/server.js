import Docker from "dockerode";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const docker = new Docker({ socketPath: "/var/run/docker.sock" });

const app = express();
const port = process.env.PORT || 4000;

app.use(express.static(path.join(__dirname, "public")));

app.get("/api/containers", async (req, res) => {
  try {
    const containers = await docker.listContainers({ all: true });
    res.json(
      containers.map((c) => ({
        id: c.Id.slice(0, 12),
        name: c.Names[0]?.replace(/^\//, "") ?? c.Id.slice(0, 12),
        image: c.Image,
        status: c.Status,
        state: c.State,
        ports: c.Ports.filter((p) => p.PublicPort).map(
          (p) => `${p.PublicPort}->${p.PrivatePort}/${p.Type}`
        ),
      }))
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => {
  console.log(`docker-dashboard listening on port ${port}`);
});
