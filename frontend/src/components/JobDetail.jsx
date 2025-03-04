import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { BoltIcon, ChevronLeftIcon, ChevronRightIcon, Briefcase, MapPin, Trophy, Users, DollarSign } from 'lucide-react';

const JobDetail = () => {
  const { id } = useParams();

  const { data: job, isLoading: isJobLoading, error: jobError } = useQuery({
    queryKey: ['job', id],
    queryFn: () => axios.get(`http://localhost:5000/api/jobs/${id}`).then(res => res.data),
  });

  console.log('Job data:', job);

  if (isJobLoading) return <div className="text-center py-20">Loading...</div>;
  if (jobError) return <div className="text-center py-20 text-red-500">Error loading job: {jobError.message}</div>;
  if (!job) return <div className="text-center py-20">Job not found</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full">
        <h1 className="text-3xl font-bold text-indigo-700 mb-4">{job.jobTitle}</h1>
        <img
          src={job.image || 'https://via.placeholder.com/500x300'}
          alt={job.jobTitle}
          className="w-full h-64 object-cover rounded-xl mb-6"
        />
        <p className="text-gray-600 mb-2"><MapPin className="inline w-5 h-5 mr-2" /> {job.location}</p>
        <p className="text-gray-600 mb-2"><DollarSign className="inline w-5 h-5 mr-2" /> {job.payment}</p>
        <p className="text-gray-600 mb-2"><Briefcase className="inline w-5 h-5 mr-2" /> {job.category || 'Uncategorized'}</p>
        <p className="text-gray-600">Contractor: {job.contractorName || 'Unknown'}</p>
      </div>
    </div>
  );
};

export default JobDetail;