import './createPost.tsx';
import { Devvit, useAsync, useWebView } from '@devvit/public-api';
import type { DevvitMessage, WebViewMessage } from './message.ts';

Devvit.configure({
  redditAPI: true,
  redis: true,
});

// Galaxy interface with JSON compatibility
interface Galaxy {
  userId: string;
  positionX: number;
  positionY: number;
  [key: string]: string | number; // Index signature for JSONValue
}

Devvit.addCustomPostType({
  name: 'Galaxsee',
  height: 'tall',
  render: (context) => {
    const { reddit, redis, ui, userId } = context;

    // Fetch username with useAsync
    const { data: username } = useAsync(async () => {
      try {
        return (await reddit.getCurrentUsername()) ?? 'anon';
      } catch (e) {
        console.log('Failed to fetch username:', e);
        return 'anon';
      }
    });

    // Load or initialize galaxy with useAsync
    const { data: galaxy } = useAsync(async () => {
      if (!userId) {
        console.log('No user ID available, using placeholder galaxy');
        return { userId: 'placeholder', positionX: 0, positionY: 0 };
      }
      const galaxyHash = 'galaxies';
      const storedGalaxy = await redis.hget(galaxyHash, userId);
      if (!storedGalaxy) {
        const newGalaxy: Galaxy = {
          userId,
          positionX: Math.random() * 1000 - 500,
          positionY: Math.random() * 1000 - 500,
        };
        await redis.hset(galaxyHash, { [userId]: JSON.stringify(newGalaxy) });
        return newGalaxy;
      }
      return JSON.parse(storedGalaxy) as Galaxy;
    });

    const webView = useWebView<WebViewMessage, DevvitMessage>({
      url: 'page.html',
      async onMessage(message, webView) {
        if (!galaxy) return; // Wait for galaxy to load
        switch (message.type) {
          case 'webViewReady':
            webView.postMessage({
              type: 'initialData',
              data: {
                username: username ?? 'Loading...',
                galaxy,
                inbox: await getInbox(),
              },
            });
            break;
          case 'scanSpace':
            const nearby = await scanSpace(galaxy);
            webView.postMessage({
              type: 'updateNearby',
              data: { nearbyGalaxies: nearby },
            });
            break;
          case 'sendSignal':
            const success = await sendSignal(galaxy, message.data.receiverId, message.data.message);
            webView.postMessage({
              type: 'signalResult',
              data: { success },
            });
            if (success) {
              const updatedInbox = await getInbox();
              webView.postMessage({
                type: 'updateInbox',
                data: { inbox: updatedInbox },
              });
            }
            break;
          default:
            throw new Error(`Unknown message type: ${message satisfies never}`);
        }
      },
      onUnmount() {
        ui.showToast('Galaxsee closed!');
      },
    });

    // Helper functions
    async function scanSpace(currentGalaxy: Galaxy): Promise<Galaxy[]> {
      const galaxyHash = 'galaxies';
      const galaxyKeys = await redis.hkeys(galaxyHash);
      const galaxies = await Promise.all(
        galaxyKeys.map(async (key) => {
          const value = await redis.hget(galaxyHash, key);
          return value ? (JSON.parse(value) as Galaxy) : null;
        })
      );
      return galaxies
        .filter((g): g is Galaxy => g !== null)
        .filter(g => {
          if (g.userId === currentGalaxy.userId) return false;
          const distance = Math.sqrt(
            Math.pow(g.positionX - currentGalaxy.positionX, 2) +
            Math.pow(g.positionY - currentGalaxy.positionY, 2)
          );
          return distance < 200;
        });
    }

    async function sendSignal(senderGalaxy: Galaxy, receiverId: string, message: string): Promise<boolean> {
      const galaxyHash = 'galaxies';
      const receiverGalaxyStr = await redis.hget(galaxyHash, receiverId);
      if (!receiverGalaxyStr) return false;
      const receiverGalaxy = JSON.parse(receiverGalaxyStr) as Galaxy;

      const distance = Math.sqrt(
        Math.pow(receiverGalaxy.positionX - senderGalaxy.positionX, 2) +
        Math.pow(receiverGalaxy.positionY - senderGalaxy.positionY, 2)
      );
      const success = distance < 100 || (distance < 200 && Math.random() > 0.5);

      if (success) {
        const signalHash = 'signals';
        const signalKey = `${Date.now()}_${senderGalaxy.userId}_${receiverId}`;
        await redis.hset(signalHash, {
          [signalKey]: JSON.stringify({
            senderId: senderGalaxy.userId,
            receiverId,
            message,
            sentAt: new Date().toISOString(),
          }),
        });
      }
      return success;
    }

    async function getInbox(): Promise<any[]> {
      if (!userId) return [];
      const signalHash = 'signals';
      const signalKeys = await redis.hkeys(signalHash);
      const signals = await Promise.all(
        signalKeys.map(async (key) => {
          const value = await redis.hget(signalHash, key);
          return value ? JSON.parse(value) : null;
        })
      );
      return signals
        .filter((s): s is any => s !== null)
        .filter(s => s.receiverId === userId);
    }

    return (
      <vstack grow padding="small" backgroundColor="#1a1a1a">
        <vstack grow alignment="middle center">
          <text size="xlarge" weight="bold" color="white">
            Galaxsee
          </text>
          <spacer size="small" />
          <vstack alignment="start middle">
            <hstack>
              <text size="medium" color="white">
                Username:
              </text>
              <text size="medium" weight="bold" color="white">
                {' '}
                {username ?? 'Loading...'}
              </text>
            </hstack>
            <hstack>
              <text size="medium" color="white">
                Galaxy Position:
              </text>
              <text size="medium" weight="bold" color="white">
                {' '}
                {galaxy
                  ? `(${galaxy.positionX.toFixed(2)}, ${galaxy.positionY.toFixed(2)})`
                  : 'Loading...'}
              </text>
            </hstack>
          </vstack>
          <spacer size="medium" />
          <button onPress={() => webView.mount()}>
            Launch Galaxsee
          </button>
        </vstack>
      </vstack>
    );
  },
});

export default Devvit;