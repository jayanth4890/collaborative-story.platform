import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createStory } from '../services/storyService';
import { useToast } from '../context/ToastContext';
import { Feather, ArrowLeft, Send } from 'lucide-react';
import { Link } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const CreateStory = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
  });
  const [loading, setLoading] = useState(false);

  const { title, description, content } = formData;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleContentChange = (value) => {
    setFormData((prev) => ({ ...prev, content: value }));
  };

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'blockquote'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      ['link'],
      ['clean']
    ],
    clipboard: {
      matchVisual: false,
    },
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'blockquote',
    'list', 'bullet',
    'link'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      return showToast('Title and Description are required', 'warning');
    }

    setLoading(true);
    try {
      const res = await createStory({
        title,
        description,
        content,
      });
      showToast('Story created successfully!', 'success');
      navigate(`/story/${res.data._id}`);
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || 'Failed to create story', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back button */}
      <div>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Feed</span>
        </Link>
      </div>

      {/* Editor Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
          <div className="p-2 bg-indigo-600 rounded-xl">
            <Feather className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100">Draft a New Story</h2>
            <p className="text-xs text-slate-400">Establish the premise and publish for collaboration</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Story Title
            </label>
            <input
              type="text"
              name="title"
              value={title}
              onChange={handleChange}
              placeholder="e.g., The Lost Chronicles of Aethelgard"
              maxLength={100}
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 rounded-2xl py-3 px-4 text-sm text-slate-200 placeholder-slate-600 outline-none transition-all duration-200"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Premise / Description
            </label>
            <textarea
              name="description"
              value={description}
              onChange={handleChange}
              placeholder="Give potential collaborators a brief overview of your story's plot, setting, or requirements..."
              rows={3}
              maxLength={500}
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 rounded-2xl py-3 px-4 text-sm text-slate-200 placeholder-slate-600 outline-none transition-all duration-200 resize-none"
              required
            />
            <div className="flex justify-between items-center mt-1.5 px-1">
              <span className="text-[10px] text-slate-500">Maximum 500 characters</span>
              <span className="text-[10px] text-slate-500">{description.length}/500</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Starting Content / First Chapter (Optional)
            </label>
            <div className="rounded-2xl overflow-hidden border border-slate-800 focus-within:border-indigo-500/60 focus-within:ring-1 focus-within:ring-indigo-500/30 transition-all duration-200">
              <ReactQuill
                theme="snow"
                value={content}
                onChange={handleContentChange}
                placeholder="Write the initial paragraphs of your story to set the style and flow..."
                modules={modules}
                formats={formats}
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/80 flex items-center justify-end gap-3">
            <Link
              to="/"
              className="px-5 py-3 border border-slate-800 hover:border-slate-700 hover:bg-slate-800/20 text-xs font-semibold rounded-2xl text-slate-400 hover:text-slate-200 transition-all duration-200"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-5 py-3 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] rounded-2xl text-xs font-semibold text-white shadow-xl shadow-indigo-600/10 transition-all duration-200 disabled:opacity-50"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Publish Story</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateStory;
