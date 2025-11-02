import Docker from "dockerode";

const docker = new Docker();

export async function POST(req) {
  const { socketId } = await req.json();
  if (!socketId) {
    return Response.json({ success: false, error: "socketId is required" }, { status: 400 });
  }

  const containerName = `sandbox-${socketId}`;
  console.log(`Cleanup requested for container: ${containerName}`);

  try {
    const containers = await docker.listContainers({ all: true });
    const containerInfo = containers.find(c => c.Names.includes(`/${containerName}`));

    if (containerInfo) {
      const container = docker.getContainer(containerInfo.Id);
      console.log(`Found container ${container.id}. Cleaning up...`);
      
      try {
        
        // Force stop the container while ignoring errors
        await container.stop({ t: 10 });
        console.log(`Container ${container.id} stopped.`);
      } catch (err) {
        if (err.statusCode === 304) {
          console.log(`Container ${container.id} was already stopped.`);
        } else {
          // Log other errors
          console.error(`Error stopping container ${container.id}:`, err.reason);
        }
      }

      // Remove the container
      await container.remove();
      console.log(`Successfully removed container ${container.id}`);
      
    } else {
      console.log(`Container ${containerName} not found, nothing to clean up.`);
    }
    return Response.json({ success: true });

  } catch (error) {

    // Ignore errors if the container is already gone
    if (error.statusCode === 404) {
        console.log(`Container ${containerName} was already removed.`);
        return Response.json({ success: true, message: "Container already removed" });
    }
    console.error(`Error during cleanup for container ${containerName}:`, error);
    return Response.json({ success: false, error: "An internal error occurred" }, { status: 500 });
  }
}
