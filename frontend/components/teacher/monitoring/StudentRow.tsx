"use client";

import { Student } from "@/types/teacher/monitoring.types";
import { Avatar, ProgressBar } from "@heroui/react";

interface StudentRowProps {
  student: Student;
}

export function StudentRow({ student }: StudentRowProps) {
  return (
    <div className="flex items-center gap-3 p-3 w-56 shrink-0 group transition-colors">
      <div className="relative">
        <Avatar size="sm" className="border border-white/20 shadow-lg">
          <Avatar.Image src={student.avatar} alt={student.name} />
          <Avatar.Fallback className="bg-gradient-to-br from-violet-500 to-indigo-600 text-white font-bold">
            {student.name.charAt(0)}
          </Avatar.Fallback>
        </Avatar>
        <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background shadow-sm ${
          student.isOnline ? "bg-success-500" : "bg-default-300"
        }`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-gray-800 dark:text-foreground truncate group-hover:text-primary transition-colors">{student.name}</p>
        <div className="flex items-center gap-2 mt-1">
          <div className="flex-1">
            <ProgressBar 
              size="sm" 
              value={student.progress} 
              className="h-1"
              color={student.progress === 100 ? "success" : "primary"}
              classNames={{ indicator: "bg-gradient-to-r from-violet-500 to-fuchsia-500" }}
            />
          </div>
          <span className="text-[9px] font-bold text-gray-500 dark:text-default-400 tabular-nums">{student.score}%</span>
        </div>
      </div>
    </div>
  );
}
