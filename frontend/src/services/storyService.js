import api from '../utils/api';

export const getStories = (page = 1, limit = 9) => {
  return api.get(`/stories?page=${page}&limit=${limit}`);
};

export const getStoryById = (id) => {
  return api.get(`/stories/${id}`);
};

export const createStory = (storyData) => {
  return api.post('/stories', storyData);
};

export const updateStory = (id, storyData) => {
  return api.put(`/stories/${id}`, storyData);
};

export const getMyStories = () => {
  return api.get('/stories/my-stories');
};

export const completeStory = (id) => {
  return api.patch(`/stories/${id}/complete`);
};

export const exportStoryPDF = (id) => {
  return api.get(`/stories/${id}/export`, { responseType: 'blob' });
};

export const deleteStory = (id) => {
  return api.delete(`/stories/${id}`);
};

export const publishStory = (id) => {
  return api.patch(`/stories/${id}/publish`);
};

export const getPublicStories = () => {
  return api.get('/stories/public');
};

export const getPublicStoryById = (id) => {
  return api.get(`/stories/public/${id}`);
};

export const likeStory = (id) => {
  return api.patch(`/stories/${id}/like`);
};

export const incrementViews = (id) => {
  return api.post(`/stories/${id}/view`);
};

export const bookmarkStory = (id) => {
  return api.patch(`/stories/${id}/bookmark`);
};

export const getBookmarkedStories = () => {
  return api.get('/stories/my-bookmarks');
};

export const commentOnStory = (id, commentData) => {
  return api.post(`/stories/${id}/comment`, commentData);
};
