'use client';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import Link from 'next/link';

interface ProjectCardProps {
  id: string;
  name: string;
  templateName: string;
  format: string;
  updatedAt: string;
  accentColor?: string;
}

export const ProjectCard = ({ id, name, templateName, format, updatedAt, accentColor = '#a855f7' }: ProjectCardProps) => {
  return (
    <Link href={`/editor/${id}`}>
      <motion.div whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.15 }}>
        <Card className="overflow-hidden border-border/40 bg-card hover:border-border cursor-pointer transition-colors">
          <div
            className="h-32 flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${accentColor}20, #38bdf810)` }}
          >
            <span className="text-xs font-mono" style={{ color: accentColor }}>▶ {templateName}</span>
          </div>
          <div className="p-3 flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium truncate">{name}</span>
              <Badge variant="outline" className="text-xs shrink-0">{format}</Badge>
            </div>
            <span className="text-xs text-muted-foreground">{updatedAt}</span>
          </div>
        </Card>
      </motion.div>
    </Link>
  );
};
