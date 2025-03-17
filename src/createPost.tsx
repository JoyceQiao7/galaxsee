import { Devvit } from '@devvit/public-api';

Devvit.addMenuItem({
  label: 'Create New Galaxsee Post',
  location: 'subreddit',
  onPress: async (_event, context) => {
    const { reddit, ui } = context;
    const subreddit = await reddit.getCurrentSubreddit();
    const post = await reddit.submitPost({
      title: 'Galaxsee Adventure',
      subredditName: subreddit.name,
      preview: (
        <vstack height="100%" width="100%" alignment="middle center">
          <text size="large">Loading Galaxsee...</text>
        </vstack>
      ),
    });
    ui.showToast({ text: 'Galaxsee post created!' });
    ui.navigateTo(post);
  },
});

export default Devvit;