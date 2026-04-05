import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/',
    timeout: 120000, // Increased to 120 seconds for long AI generations
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('token');
            if (window.location.pathname !== '/login' && window.location.pathname !== '/signup') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export const loginUser = (data) => api.post('/auth/login', data);
export const signupUser = (data) => api.post('/auth/signup', data);
export const fetchMe = () => api.get('/auth/me');
export const submitOnboarding = (data) => api.post('/profiles/onboarding', data);
export const updateGoals = (data) => api.put('/profiles/goals', data);
export const uploadProfileImage = (formData) => api.post('/profiles/image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
});

export const fetchAssessmentQuestions = () => api.get('/assessment/questions');
export const hasCompletedAssessment = () => api.get('/assessment/has_completed');
export const submitAssessment = (answers) => api.post('/assessment/evaluate', answers);
export const fetchSkillAnalysis = () => api.get('/analysis/skills');
export const generateReadiness = () => api.get('/analysis/readiness');
export const fetchProgressReport = () => api.get('/analysis/progress-report');


export const uploadSyllabus = (formData) => api.post('/upload/syllabus', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
});
export const getCourses = () => api.get('/roadmap/courses');
export const getCourseTopics = (courseId) => api.get(`/roadmap/course/${courseId}/topics`);
export const generateRoadmap = (data) => api.post('/roadmap/generate', data);
export const generateRoadmapFromGoal = () => api.post('/roadmap/generate_from_goal');
export const generateCustomRoadmap = (data) => api.post('/roadmap/generate_custom', data);
export const getTopic = (id) => api.get(`/roadmap/topic/${id}`);
export const getQuiz = (id) => api.get(`/quiz/topic/${id}`);
export const regenQuiz = (id) => api.get(`/quiz/topic/${id}?regenerate=true`);
export const submitQuiz = (id, data) => api.post(`/quiz/submit/${id}`, data);
export const chatWithMentor = (data) => api.post('/mentor/chat', data);
export const getTopicMaterials = (id, query = '') => api.get(`/roadmap/topic/${id}/materials`, { params: { query } });

export const createGroup = (data) => api.post('/groups/', data);
export const joinGroup = (groupId) => api.post(`/groups/${groupId}/join`);
export const getMyGroups = () => api.get('/groups/my_groups');
export const getGroupDashboard = (groupId) => api.get(`/groups/${groupId}/dashboard`);
export const getGroupInsights = (groupId) => api.get(`/groups/${groupId}/insights`);
export const addStudyLog = (groupId, data) => api.post(`/groups/${groupId}/study_logs`, data);

export const getGroupDoubts = (groupId) => api.get(`/groups/${groupId}/doubts`);
export const createGroupDoubt = (groupId, data) => api.post(`/groups/${groupId}/doubts`, data);
export const replyToGroupDoubt = (groupId, doubtId, data) => api.post(`/groups/${groupId}/doubts/${doubtId}/reply`, data);
export const resolveGroupDoubt = (groupId, doubtId) => api.put(`/groups/${groupId}/doubts/${doubtId}/resolve`);

export const getGroupChallenges = (groupId) => api.get(`/groups/${groupId}/challenges`);
export const createGroupChallenge = (groupId, data) => api.post(`/groups/${groupId}/challenges`, data);

export const updateGroupSettings = (groupId, name) => api.put(`/groups/${groupId}?name=${encodeURIComponent(name)}`);
export const removeGroupMember = (groupId, userId) => api.delete(`/groups/${groupId}/members/${userId}`);

export default api;
