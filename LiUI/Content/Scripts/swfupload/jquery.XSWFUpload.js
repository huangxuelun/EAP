﻿/*
* jQuery SWFUpload v1.0
*

* Depends:
*	swfupload.swf
*  swfupload.js
*	fileprogress.js
*  swfupload.queue.js
*	fileprogress.js
*  uploadprogress.css
*/


(function ($) {

    function preLoad() {
        if (!this.support.loading) {
            alert("You need the Flash Player 9.028 or above to use SWFUpload.");
            return false;
        }
    }
    function loadFailed() {
        alert("Something went wrong while loading SWFUpload. If this were a real application we'd clean up and then give you an alternative");
    }

    function fileQueued(file) {
        try {
            var progress = new FileProgress(file, this.customSettings.progressTarget);
            progress.setStatus("准备上传...");
            progress.toggleCancel(true, this);

        } catch (ex) {
            this.debug(ex);
        }

    }

    function fileQueueError(file, errorCode, message) {
        try {
            if (errorCode === SWFUpload.QUEUE_ERROR.QUEUE_LIMIT_EXCEEDED) {
                alert("You have attempted to queue too many files.\n" + (message === 0 ? "You have reached the upload limit." : "You may select " + (message > 1 ? "up to " + message + " files." : "one file.")));
                return;
            }

            var progress = new FileProgress(file, this.customSettings.progressTarget);
            progress.setError();
            progress.toggleCancel(false);

            switch (errorCode) {
                case SWFUpload.QUEUE_ERROR.FILE_EXCEEDS_SIZE_LIMIT:
                    progress.setStatus("File is too big.");
                    this.debug("Error Code: File too big, File name: " + file.name + ", File size: " + file.size + ", Message: " + message);
                    break;
                case SWFUpload.QUEUE_ERROR.ZERO_BYTE_FILE:
                    progress.setStatus("Cannot upload Zero Byte files.");
                    this.debug("Error Code: Zero byte file, File name: " + file.name + ", File size: " + file.size + ", Message: " + message);
                    break;
                case SWFUpload.QUEUE_ERROR.INVALID_FILETYPE:
                    progress.setStatus("Invalid File Type.");
                    this.debug("Error Code: Invalid File Type, File name: " + file.name + ", File size: " + file.size + ", Message: " + message);
                    break;
                default:
                    if (file !== null) {
                        progress.setStatus("Unhandled Error");
                    }
                    this.debug("Error Code: " + errorCode + ", File name: " + file.name + ", File size: " + file.size + ", Message: " + message);
                    break;
            }
        } catch (ex) {
            this.debug(ex);
        }
    }

    function fileDialogComplete(numFilesSelected, numFilesQueued) {
        try {
            if (numFilesSelected > 0) {
                document.getElementById(this.customSettings.cancelButtonId).disabled = false;
            }

            /* I want auto start the upload and I can do that here */
            this.startUpload();
        } catch (ex) {
            this.debug(ex);
        }
    }

    function uploadStart(file) {
        try {
            /* I don't want to do any file validation or anything,  I'll just update the UI and
            return true to indicate that the upload should start.
            It's important to update the UI here because in Linux no uploadProgress events are called. The best
            we can do is say we are uploading.
            */
            var progress = new FileProgress(file, this.customSettings.progressTarget);
            progress.setStatus("Uploading...");
            progress.toggleCancel(true, this);
        }
        catch (ex) { }

        return true;
    }

    function uploadProgress(file, bytesLoaded, bytesTotal) {
        try {
            var percent = Math.ceil((bytesLoaded / bytesTotal) * 100);

            var progress = new FileProgress(file, this.customSettings.progressTarget);
            progress.setProgress(percent);
            progress.setStatus("Uploading...");
        } catch (ex) {
            this.debug(ex);
        }
    }

    function uploadSuccess(file, serverData) {
        try {
            var progress = new FileProgress(file, this.customSettings.progressTarget);
            progress.setComplete();
            progress.setStatus("Complete.");
            progress.toggleCancel(false);

        } catch (ex) {
            this.debug(ex);
        }
    }

    function uploadError(file, errorCode, message) {
        try {
            var progress = new FileProgress(file, this.customSettings.progressTarget);
            progress.setError();
            progress.toggleCancel(false);

            switch (errorCode) {
                case SWFUpload.UPLOAD_ERROR.HTTP_ERROR:
                    progress.setStatus("Upload Error: " + message);
                    this.debug("Error Code: HTTP Error, File name: " + file.name + ", Message: " + message);
                    break;
                case SWFUpload.UPLOAD_ERROR.UPLOAD_FAILED:
                    progress.setStatus("Upload Failed.");
                    this.debug("Error Code: Upload Failed, File name: " + file.name + ", File size: " + file.size + ", Message: " + message);
                    break;
                case SWFUpload.UPLOAD_ERROR.IO_ERROR:
                    progress.setStatus("Server (IO) Error");
                    this.debug("Error Code: IO Error, File name: " + file.name + ", Message: " + message);
                    break;
                case SWFUpload.UPLOAD_ERROR.SECURITY_ERROR:
                    progress.setStatus("Security Error");
                    this.debug("Error Code: Security Error, File name: " + file.name + ", Message: " + message);
                    break;
                case SWFUpload.UPLOAD_ERROR.UPLOAD_LIMIT_EXCEEDED:
                    progress.setStatus("Upload limit exceeded.");
                    this.debug("Error Code: Upload Limit Exceeded, File name: " + file.name + ", File size: " + file.size + ", Message: " + message);
                    break;
                case SWFUpload.UPLOAD_ERROR.FILE_VALIDATION_FAILED:
                    progress.setStatus("Failed Validation.  Upload skipped.");
                    this.debug("Error Code: File Validation Failed, File name: " + file.name + ", File size: " + file.size + ", Message: " + message);
                    break;
                case SWFUpload.UPLOAD_ERROR.FILE_CANCELLED:
                    // If there aren't any files left (they were all cancelled) disable the cancel button
                    if (this.getStats().files_queued === 0) {
                        document.getElementById(this.customSettings.cancelButtonId).disabled = true;
                    }
                    progress.setStatus("Cancelled");
                    progress.setCancelled();
                    break;
                case SWFUpload.UPLOAD_ERROR.UPLOAD_STOPPED:
                    progress.setStatus("Stopped");
                    break;
                default:
                    progress.setStatus("Unhandled Error: " + errorCode);
                    this.debug("Error Code: " + errorCode + ", File name: " + file.name + ", File size: " + file.size + ", Message: " + message);
                    break;
            }
        } catch (ex) {
            this.debug(ex);
        }
    }

    function uploadComplete(file) {
        if (this.getStats().files_queued === 0) {
            document.getElementById(this.customSettings.cancelButtonId).disabled = true;
        }
    }

    // This event comes from the Queue Plugin
    function queueComplete(numFilesUploaded) {
//        var status = document.getElementById("divStatus");
//        status.innerHTML = numFilesUploaded + " file" + (numFilesUploaded === 1 ? "" : "s") + " uploaded.";
    }


    $.fn.XSWFUpload = function (options) {
        var opts = $.extend({}, $.fn.XSWFUpload.defaults, options);

        return this.each(function () {
            $this = $(this);
            var o = $.meta ? $.extend({}, opts, $this.data()) : opts;
            if (o.upload_url == null || o.upload_url == "") {
                o.upload_url = document.URL;
            };
            if (o.button_placeholder_id == null || o.button_placeholder_id == "") {
                o.button_placeholder_id = this.id;
            };

            swfu = new SWFUpload(o);
        });
    },

    $.fn.XSWFUpload.defaults = {
        upload_url: "",
        flash_url: "/Content/Scripts/swfupload/swfupload.swf",
        flash9_url: "/Content/Scripts/swfupload/swfupload_fp9.swf",
        file_types: "*.*",
        file_size_limit: "20 MB",
        button_text: "浏览",
        button_text_style: "",
        button_text_left_padding: 12,
        button_text_top_padding: 3,
        button_width: 60,
        button_height: 24,
        button_placeholder_id: "",
        post_params: {},
        button_cursor: SWFUpload.CURSOR.HAND,
        custom_settings: {
            progressTarget: "fsUploadProgress",
            cancelButtonId: "btnCancel"
        },
        file_queue_limit: 1,
        debug: false,
        file_queued_handler: fileQueued,
        file_queue_error_handler: fileQueueError,
        file_dialog_complete_handler: fileDialogComplete,
        upload_start_handler: uploadStart,
        upload_progress_handler: uploadProgress,
        upload_error_handler: uploadError,
        upload_success_handler: uploadSuccess,
        upload_complete_handler: uploadComplete,
        queue_complete_handler: queueComplete	// Queue plugin event
    }




})(jQuery);