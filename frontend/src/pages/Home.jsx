// Home.js
import React from 'react';
import { LightbulbIcon as LightBulbIcon, BoltIcon, UsersIcon } from 'lucide-react';
import JourneySection from '../components/JourneySection';


const Home = () => {
  const features = [
    {
      Icon: LightBulbIcon,
      title: "Innovative Ideas",
      description: "We bring fresh ideas to connect laborers with hirers seamlessly."
    },
    {
      Icon: BoltIcon,
      title: "Unmatched Efficiency",
      description: "Our platform optimizes every step to reduce delays and improve outcomes."
    },
    {
      Icon: UsersIcon,
      title: "Building Community",
      description: "We're more than a platform; we're a community that fosters growth."
    }
  ];

  const jobPosts = [
    {
      title: "Full Stack Development Course",
      company: "650+ students enrolled",
      description: "Get Placed with ₹3-10 LPA Salary",
      buttonText: "Apply now"
    },
    {
      title: "Full Stack Development Course",
      company: "650+ students enrolled",
      description: "Get Placed with ₹3-10 LPA Salary",
      buttonText: "Apply now"
    },
    {
      title: "Full Stack Development Course",
      company: "650+ students enrolled",
      description: "Get Placed with ₹3-10 LPA Salary",
      buttonText: "Apply now"
    },
    {
      title: "Special Certification Courses",
      company: "Limited Time Offer",
      description: "Get FLAT 80% OFF on all online trainings",
      buttonText: "Know more"
    },
    {
      title: "Sales Trainee Position",
      company: "Godrej Agrovet",
      description: "Join as a Sales Trainee with a CTC of up to 4 LPA. For Women graduates with a degree in B.Sc. Agriculture or related fields.",
      buttonText: "Apply Now"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col relative bg-white text-white pt-15">
      <JourneySection jobPosts={jobPosts} />
    </div>
  );
};

export default Home;