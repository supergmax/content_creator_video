'use client';
import { motion } from 'framer-motion';
import { ProjectCard } from './ProjectCard';
import Link from 'next/link';

const DEMO_PROJECTS = [
  { id: 'demo-1', name: 'Product Launch', templateName: 'SaaS Promo', format: '16:9', updatedAt: 'il y a 2h', accentColor: '#a855f7' },
  { id: 'demo-2', name: 'Reel Intro', templateName: 'Social Hook', format: '9:16', updatedAt: 'hier', accentColor: '#f59e0b' },
];

export const ProjectGrid = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {DEMO_PROJECTS.map((project, i) => (
        <motion.div
          key={project.id}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08 }}
        >
          <ProjectCard {...project} />
        </motion.div>
      ))}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: DEMO_PROJECTS.length * 0.08 }}
      >
        <Link href="/editor/new">
          <div className="h-full min-h-40 flex items-center justify-center border border-dashed border-border/40 rounded-lg hover:border-border/70 transition-colors cursor-pointer">
            <span className="text-3xl text-muted-foreground">+</span>
          </div>
        </Link>
      </motion.div>
    </div>
  );
};
