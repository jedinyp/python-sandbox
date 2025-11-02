import Docker from "dockerode";

const docker = new Docker();

// Find a container by name or return null
const findContainer = async (containerName) => {
  try {
    const containers = await docker.listContainers({ all: true });
    const existing = containers.find(c => c.Names.includes(`/${containerName}`));
    return existing ? docker.getContainer(existing.Id) : null;
  } catch (error) {
    console.error("Error finding container:", error);
    return null;
  }
};

export async function POST(req) {
  const { code, socketId } = await req.json();
  const containerName = `sandbox-${socketId}`;

  try {
    let container = await findContainer(containerName);

    if (!container) {
      console.log(`Container not found for ${socketId}. Creating with in-memory tmpfs...`);
      
      container = await docker.createContainer({
        Image: "python-sandbox-image",
        name: containerName,
        Cmd: ["tail", "-f", "/dev/null"],
        HostConfig: {
          Memory: 256 * 1024 * 1024,
          CpuPeriod: 100000,
          CpuQuota: 50000,
          Tmpfs: { "/packages": "rw,exec,size=256m" },
          ReadOnlyRootfs: true,
          ExtraHosts: ["host.docker.internal:host-gateway"],
        },
        SecurityOpt: ["no-new-privileges"],
      });
      await container.start();
      console.log(`Container ${container.id} started for ${socketId}.`);
    }

    const exec = await container.exec({
      Cmd: ["/sandbox/auto_install_python.sh", code, socketId],
      AttachStdout: false, 
      AttachStderr: false,
      User: "sandbox",
    });

    // Start the exec and immediately return
    await exec.start({ detach: true });

    return Response.json({ success: true });

  } catch (error) {
    console.error("Error during Docker execution:", error);
    return Response.json({ success: false, error: "An internal error occurred." }, { status: 500 });
  }
}
