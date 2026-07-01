import mqtt from "mqtt";

type PublishLockerCommandParams = {
  commandId: string;
  lockerId: string;
  lockerNumber: number;
  command: "open" | "close";
};

function getMqttConfig() {
  const brokerUrl = process.env.MQTT_BROKER_URL;

  if (!brokerUrl || brokerUrl.includes("broker-host")) {
    return null;
  }

  return {
    brokerUrl,
    username: process.env.MQTT_USERNAME || undefined,
    password: process.env.MQTT_PASSWORD || undefined,
    topicPrefix: process.env.MQTT_TOPIC_PREFIX || "smart-loker"
  };
}

export async function publishLockerCommand({
  commandId,
  lockerId,
  lockerNumber,
  command
}: PublishLockerCommandParams) {
  const config = getMqttConfig();

  if (!config) {
    return {
      published: false,
      message: "MQTT belum dikonfigurasi."
    };
  }

  const topic = `${config.topicPrefix}/command/loker-${lockerNumber}`;
  const payload = JSON.stringify({
    commandId,
    lockerId,
    lockerNumber,
    command
  });

  await new Promise<void>((resolve, reject) => {
    const client = mqtt.connect(config.brokerUrl, {
      username: config.username,
      password: config.password,
      reconnectPeriod: 0,
      connectTimeout: 8000,
      clientId: `smart-loker-web-${Date.now()}`
    });

    client.on("connect", () => {
      client.publish(topic, payload, { qos: 1 }, (error) => {
        client.end(true);

        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });

    client.on("error", (error) => {
      client.end(true);
      reject(error);
    });
  });

  return {
    published: true,
    topic
  };
}
