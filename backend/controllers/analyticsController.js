const Story = require('../models/Story');
const Contribution = require('../models/Contribution');
const Invitation = require('../models/Invitation');

/**
 * @desc    Get dashboard analytics metrics and chart data
 * @route   GET /api/dashboard/analytics
 * @access  Private
 */
const getAnalytics = async (req, res) => {
  try {
    // 1. Core KPIs — run all counts concurrently
    const [totalStories, completedStories, totalContributions, pendingInvitations, collaboratorAgg] =
      await Promise.all([
        Story.countDocuments({}),
        Story.countDocuments({ status: 'completed' }),
        Contribution.countDocuments({}),
        Invitation.countDocuments({ status: 'pending' }),
        Story.aggregate([
          {
            $project: {
              people: {
                $concatArrays: [['$author'], { $ifNull: ['$contributors', []] }],
              },
            },
          },
          { $unwind: '$people' },
          { $group: { _id: '$people' } },
          { $count: 'count' },
        ]),
      ]);

    const activeCollaborators = collaboratorAgg[0]?.count || 0;

    const completionRate = totalStories > 0
      ? Math.round((completedStories / totalStories) * 100)
      : 0;

    // 2. Charts Data
    // A. Stories created over time (grouped by date)
    const storiesOverTime = await Story.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      { $limit: 10 }
    ]);

    let formattedStoriesOverTime = storiesOverTime.map((item) => ({
      date: item._id,
      count: item.count
    }));

    // B. Contributions per story (top 5 stories)
    const contributionsPerStory = await Contribution.aggregate([
      {
        $group: {
          _id: "$story",
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: "stories",
          localField: "_id",
          foreignField: "_id",
          as: "storyDetails"
        }
      },
      { $unwind: "$storyDetails" },
      {
        $project: {
          title: "$storyDetails.title",
          count: 1
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    let formattedContributionsPerStory = contributionsPerStory.map((item) => ({
      title: item.title.length > 20 ? item.title.slice(0, 17) + '...' : item.title,
      count: item.count
    }));

    // C. Handle fallback mock data for charts if database is new/empty
    if (formattedStoriesOverTime.length === 0) {
      // Mock data for last 5 days
      const today = new Date();
      for (let i = 4; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const dateString = d.toISOString().split('T')[0];
        formattedStoriesOverTime.push({
          date: dateString,
          count: i === 4 ? 1 : i === 2 ? 2 : i === 0 ? 1 : 0
        });
      }
    }

    if (formattedContributionsPerStory.length === 0) {
      formattedContributionsPerStory = [
        { title: "Chronicles of Eldoria", count: 8 },
        { title: "Shadows in the Mist", count: 5 },
        { title: "The Cosmic Voyager", count: 3 }
      ];
    }

    res.json({
      totalStories,
      completedStories,
      totalContributions,
      activeCollaborators,
      pendingInvitations,
      completionRate,
      storiesOverTime: formattedStoriesOverTime,
      contributionsPerStory: formattedContributionsPerStory
    });
  } catch (error) {
    console.error('Analytics Fetch Error:', error.message);
    res.status(500).json({ message: 'Failed to retrieve dashboard analytics' });
  }
};

module.exports = {
  getAnalytics
};
