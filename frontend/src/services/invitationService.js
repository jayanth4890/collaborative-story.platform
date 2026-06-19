import api from '../utils/api';

export const inviteUser = (invitationData) => {
  return api.post('/invitations', invitationData);
};

export const getMyInvitations = () => {
  return api.get('/invitations/my-invitations');
};

export const respondToInvitation = (id, responseData) => {
  return api.patch(`/invitations/${id}/respond`, responseData);
};

export const getStoryInvitations = (storyId) => {
  return api.get(`/invitations/story/${storyId}`);
};
