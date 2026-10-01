import React, { useState, useEffect } from 'react';
import {
  X,
  FolderArchive,
  Calendar,
  Building2,
  Briefcase,
  Link2,
  ArrowRight,
  Maximize2,
  Minimize2,
  Search,
  DollarSign,
  FileCheck,
} from 'lucide-react';
import { fetchApplications, fetchApplicationDetails } from '../utils/api';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from './ui/table';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from './ui/drawer';
import AppAlertDialog from './ui/app-alert-dialog';

export default function HistoryDrawer({ isOpen, onClose, onLoadApplication }) {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingFolder, setLoadingFolder] = useState(null);
  const [errorDialog, setErrorDialog] = useState({ isOpen: false, title: '', message: '' });

  useEffect(() => {
    if (isOpen) {
      loadList();
    }
  }, [isOpen]);

  const loadList = async () => {
    setLoading(true);
    try {
      const data = await fetchApplications();
      setApplications(data.applications || []);
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = async (folderName) => {
    setLoadingFolder(folderName);
    try {
      const appData = await fetchApplicationDetails(folderName);
      if (onLoadApplication) {
        onLoadApplication(appData);
        onClose();
      }
    } catch (err) {
      setErrorDialog({
        isOpen: true,
        title: 'Could Not Load Application',
        message: err.message || 'Failed to read application bundle files.',
      });
    } finally {
      setLoadingFolder(null);
    }
  };

  const formatRate = (rate) => {
    if (rate === null || rate === undefined || rate === '') return '—';
    const num = Number(rate);
    if (!isNaN(num) && num > 0) {
      return `$${num.toLocaleString()}`;
    }
    return String(rate);
  };

  const renderRateTypeBadge = (type) => {
    if (!type) return <span className="text-slate-400">—</span>;
    const lower = String(type).toLowerCase();
    let badgeColor = 'bg-slate-100 text-slate-700 border-slate-200';
    let label = type.charAt(0).toUpperCase() + type.slice(1);
    if (lower === 'hourly') {
      badgeColor = 'bg-blue-50 text-blue-700 border-blue-200';
      label = 'Hourly';
    } else if (lower === 'yearly') {
      badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      label = 'Yearly';
    } else if (lower === 'monthly') {
      badgeColor = 'bg-purple-50 text-purple-700 border-purple-200';
      label = 'Monthly';
    }
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${badgeColor}`}>
        {label}
      </span>
    );
  };

  const filteredApplications = applications.filter((app) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (app.companyName || '').toLowerCase().includes(q) ||
      (app.roleTitle || '').toLowerCase().includes(q) ||
      (app.rateType || '').toLowerCase().includes(q) ||
      (app.minRate && String(app.minRate).includes(q)) ||
      (app.maxRate && String(app.maxRate).includes(q))
    );
  });

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()} direction="right">
      <DrawerContent
        className={`transition-all duration-300 ${
          isExpanded
            ? 'max-w-[96vw] sm:max-w-[95vw]'
            : 'max-w-4xl sm:max-w-5xl'
        }`}
      >
        {/* Drawer Header */}
        <DrawerHeader className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <FolderArchive className="w-4 h-4" />
            </div>
            <div>
              <DrawerTitle>Saved Applications</DrawerTitle>
              <DrawerDescription>
                Application tracking table stored locally in <code className="text-indigo-700 bg-indigo-50 px-1 rounded font-mono">./applications/</code>
              </DrawerDescription>
            </div>
          </div>

          <div className="flex items-center space-x-1.5">
            {/* Extend / Collapse Drawer Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 w-8 text-slate-500 hover:text-slate-800"
              title={isExpanded ? 'Collapse width' : 'Expand full width'}
            >
              {isExpanded ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </Button>

            <DrawerClose asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8 text-slate-500 hover:text-slate-800"
              >
                <X className="w-4 h-4" />
              </Button>
            </DrawerClose>
          </div>
        </DrawerHeader>

        {/* Search & Filter Toolbar */}
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between gap-3 bg-slate-50/50">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              type="text"
              placeholder="Search company, position, or rate..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 text-xs h-8"
            />
          </div>
          <div className="text-xs text-slate-500 font-medium whitespace-nowrap">
            Showing {filteredApplications.length} of {applications.length} applications
          </div>
        </div>

        {/* Drawer Body: Table */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-500 animate-pulse">
              Loading saved applications...
            </div>
          ) : applications.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-xl">
              No saved applications yet. Generate a resume and click <strong>Save Bundle</strong> to track applications here!
            </div>
          ) : filteredApplications.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No applications matched your search "{searchQuery}".
            </div>
          ) : (
            <div className="border border-slate-200 rounded-lg overflow-hidden shadow-2xs">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">Company Name</TableHead>
                    <TableHead className="w-[180px]">Position Name</TableHead>
                    <TableHead className="w-[110px]">Min Rate</TableHead>
                    <TableHead className="w-[110px]">Max Rate</TableHead>
                    <TableHead className="w-[110px]">Rate Type</TableHead>
                    <TableHead>Date / Assets</TableHead>
                    <TableHead className="text-right w-[90px]">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredApplications.map((app, idx) => (
                    <TableRow key={idx} className="hover:bg-slate-50/70">
                      {/* Company Name */}
                      <TableCell className="font-semibold text-slate-800">
                        <div className="flex items-center space-x-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span className="truncate">{app.companyName || '—'}</span>
                        </div>
                      </TableCell>

                      {/* Position Name */}
                      <TableCell className="text-slate-700">
                        <div className="flex items-center space-x-1.5">
                          <Briefcase className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span className="truncate">{app.roleTitle || '—'}</span>
                        </div>
                      </TableCell>

                      {/* Min Rate */}
                      <TableCell className="font-mono font-medium text-slate-700">
                        {formatRate(app.minRate)}
                      </TableCell>

                      {/* Max Rate */}
                      <TableCell className="font-mono font-medium text-slate-700">
                        {formatRate(app.maxRate)}
                      </TableCell>

                      {/* Rate Type */}
                      <TableCell>
                        {renderRateTypeBadge(app.rateType)}
                      </TableCell>

                      {/* Date / Assets */}
                      <TableCell>
                        <div className="flex items-center space-x-2 text-[11px] text-slate-500">
                          <span className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3 text-slate-400 flex-shrink-0" />
                            <span>
                              {app.createdAt ? new Date(app.createdAt).toLocaleDateString() : '—'}
                            </span>
                          </span>

                          <div className="flex items-center space-x-1.5">
                            {app.jobUrl && (
                              <a
                                href={app.jobUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-blue-600 hover:underline flex items-center space-x-0.5"
                                title={app.jobUrl}
                              >
                                <Link2 className="w-3 h-3" />
                                <span>Link</span>
                              </a>
                            )}
                            {app.hasResumePdf && (
                              <span className="text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded text-[10px] font-mono font-medium border border-emerald-100">
                                PDF
                              </span>
                            )}
                            {app.hasResumeDocx && (
                              <span className="text-indigo-700 bg-indigo-50 px-1 py-0.5 rounded text-[10px] font-mono font-medium border border-indigo-100">
                                DOCX
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* Action */}
                      <TableCell className="text-right">
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={loadingFolder === app.folderName}
                          onClick={() => handleSelect(app.folderName)}
                          className="h-7 px-2.5 text-xs font-medium"
                        >
                          <span>{loadingFolder === app.folderName ? 'Loading...' : 'Load'}</span>
                          <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        <DrawerFooter className="flex-row justify-between items-center py-3">
          <span className="text-xs text-slate-500">
            {applications.length} applications saved locally in storage
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
          >
            Close
          </Button>
        </DrawerFooter>
      </DrawerContent>

      <AppAlertDialog
        isOpen={errorDialog.isOpen}
        onClose={() => setErrorDialog((prev) => ({ ...prev, isOpen: false }))}
        title={errorDialog.title}
        description={errorDialog.message}
        type="error"
      />
    </Drawer>
  );
}
