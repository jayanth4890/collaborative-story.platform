import api from '../utils/api';

export const createContribution = (contributionData) => {
  return api.post('/contributions', contributionData);
};

export const reviewContribution = (id, reviewData) => {
  return api.patch(`/contributions/${id}/review`, reviewData);
};

export const getMyContributions = () => {
  return api.get('/contributions/my-contributions');
};

export const getStoryContributions = (storyId) => {
  return api.get(`/contributions/story/${storyId}`);
};
