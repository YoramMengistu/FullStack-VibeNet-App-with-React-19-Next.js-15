import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import prisma from "@/lib/client";

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error("Please add WEBHOOK_SECRET from Clerk Dashboard to .env");
  }

  // Get the headers
  const headerPayload = headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error occured -- no svix headers", {
      status: 400,
    });
  }

  // Get the body

  const payload = await req.json();
  const body = JSON.stringify(payload);
  console.log("Webhook body:", body);

  // Create a new Svix instance with your secret.
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new Response("Error occured", {
      status: 400,
    });
  }

  // Do something with the payload
  // For this guide, you simply log the payload to the console
  const { id } = evt.data;
  const eventType = evt.type;
  // console.log(`Webhook with and ID of ${id} and type of ${eventType}`);
  // console.log("Webhook body:", body);

  if (eventType === "user.created") {
    try {
      await prisma.user.create({
        data: {
          id: evt.data.id,
          username: JSON.parse(body).data.username,
          avatar: JSON.parse(body).data.image_url || "/noAvatar.png",
          cover: "/noCover.png",
        },
      });
      return new Response("User has been created!", { status: 200 });
    } catch (err) {
      console.log(err);
      return new Response("Failed to create the user!", { status: 500 });
    }
  }
  if (eventType === "user.updated") {
    try {
      await prisma.user.update({
        where: {
          id: evt.data.id,
        },
        data: {
          username: JSON.parse(body).data.username,
          avatar: JSON.parse(body).data.image_url || "/noAvatar.png",
        },
      });
      return new Response("User has been updated!", { status: 200 });
    } catch (err) {
      console.log(err);
      return new Response("Failed to update the user!", { status: 500 });
    }
  }

  return new Response("Webhook received", { status: 200 });
}

// import { Webhook } from "svix";
// import { headers } from "next/headers";
// import { WebhookEvent } from "@clerk/nextjs/server";
// import prisma from "@/lib/client";

// export async function POST(req: Request) {
//   const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

//   if (!WEBHOOK_SECRET) {
//     throw new Error("Please add WEBHOOK_SECRET from Clerk Dashboard to .env");
//   }

//   // Get the headers
//   const headerPayload = req.headers as any;
//   console.log("Received headers:", {
//     "svix-id": headerPayload.get("svix-id"),
//     "svix-timestamp": headerPayload.get("svix-timestamp"),
//     "svix-signature": headerPayload.get("svix-signature"),
//   });
//   const svix_id = headerPayload.get("svix-id");
//   const svix_timestamp = headerPayload.get("svix-timestamp");
//   const svix_signature = headerPayload.get("svix-signature");

//   // If there are no headers, error out
//   if (!svix_id || !svix_timestamp || !svix_signature) {
//     return new Response("Error occurred -- no svix headers", {
//       status: 400,
//     });
//   }

//   // Get the body
//   const payload = await req.json();
//   const body = JSON.stringify(payload);
//   console.log("Webhook body:", body);

//   // Create a new Svix instance with your secret.
//   const wh = new Webhook(WEBHOOK_SECRET);

//   let evt: WebhookEvent;

//   // Verify the payload with the headers
//   try {
//     evt = wh.verify(body, {
//       "svix-id": svix_id,
//       "svix-timestamp": svix_timestamp,
//       "svix-signature": svix_signature,
//     }) as WebhookEvent;
//   } catch (err) {
//     console.error("Error verifying webhook:", err);
//     return new Response("Error occurred during verification", {
//       status: 400,
//     });
//   }

//   // Log the event to check the structure
//   console.log("Webhook event data:", JSON.stringify(evt.data, null, 2));

//   const eventType = evt.type;
//   console.log(`Received event of type: ${eventType}`);

//   // Extract user-related data directly from evt.data
//   const userData = evt.data as any;
//   const username = userData.username || "defaultUsername";
//   const avatar = userData.image_url || "/noAvatar.png";

//   try {
//     if (eventType === "user.created") {
//       await prisma.user.create({
//         data: {
//           id: userData.id,
//           username: username,
//           avatar: avatar,
//           cover: "/noCover.png",
//         },
//       });
//       return new Response("User has been created!", { status: 200 });
//     } else if (eventType === "user.updated") {
//       await prisma.user.update({
//         where: {
//           id: userData.id,
//         },
//         data: {
//           username: username,
//           avatar: avatar,
//         },
//       });
//       return new Response("User has been updated!", { status: 200 });
//     }
//   } catch (err) {
//     console.log(err);
//     return new Response("Failed to process the user!", { status: 500 });
//   }

//   return new Response("Webhook received and processed", { status: 200 });
// }
