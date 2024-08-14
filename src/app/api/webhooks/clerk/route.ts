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
//   const headerPayload = headers();
//   const svix_id = headerPayload.get("msg_2keGwN7MauDRyn88RqjZXG8ir9R");
//   const svix_timestamp = headerPayload.get("1654012591514");
//   const svix_signature = headerPayload.get("svix-signature");

//   // If there are no headers, error out
//   if (!svix_id || !svix_timestamp || !svix_signature) {
//     return new Response("Error occured -- no svix headers", {
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
//     return new Response("Error occured", {
//       status: 400,
//     });
//   }

//   // Do something with the payload
//   // For this guide, you simply log the payload to the console
//   const { id } = evt.data;
//   const eventType = evt.type;
//   // console.log(`Webhook with and ID of ${id} and type of ${eventType}`);
//   // console.log("Webhook body:", body);

//   if (eventType === "user.created") {
//     try {
//       await prisma.user.create({
//         data: {
//           id: evt.data.id,
//           username: JSON.parse(body).data.username,
//           avatar: JSON.parse(body).data.image_url || "/noAvatar.png",
//           cover: "/noCover.png",
//         },
//       });
//       return new Response("User has been created!", { status: 200 });
//     } catch (err) {
//       console.log(err);
//       return new Response("Failed to create the user!", { status: 500 });
//     }
//   }
//   if (eventType === "user.updated") {
//     try {
//       await prisma.user.update({
//         where: {
//           id: evt.data.id,
//         },
//         data: {
//           username: JSON.parse(body).data.username,
//           avatar: JSON.parse(body).data.image_url || "/noAvatar.png",
//         },
//       });
//       return new Response("User has been updated!", { status: 200 });
//     } catch (err) {
//       console.log(err);
//       return new Response("Failed to update the user!", { status: 500 });
//     }
//   }

//   return new Response("Webhook received", { status: 200 });
// }

import { Webhook } from "svix";
import { WebhookEvent } from "@clerk/nextjs/server";
import prisma from "@/lib/client";

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error("Please add WEBHOOK_SECRET from Clerk Dashboard to .env");
  }

  // Get the headers
  const headers = req.headers;
  const svix_id = headers.get("svix-id");
  const svix_timestamp = headers.get("svix-timestamp");
  const svix_signature = headers.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error occurred -- no svix headers", {
      status: 400,
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);
  console.log("Webhook body:", body);

  // Create a new Svix instance with your secret
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
    return new Response("Error occurred", {
      status: 400,
    });
  }

  // Process the payload based on event type
  const { id } = evt.data;
  const eventType = evt.type;

  if (eventType === "user.created") {
    try {
      await prisma.user.create({
        data: {
          id: evt.data.id,
          username: evt.data.username || "Unknown",
          avatar: evt.data.image_url || "/noAvatar.png",
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
          username: evt.data.username || "Unknown",
          avatar: evt.data.image_url || "/noAvatar.png",
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
