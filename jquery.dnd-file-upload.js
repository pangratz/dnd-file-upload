(function($) {

	var opts = {};

	$.fn.dropzone = function(options) {

		// Extend our default options with those provided.
		opts = $.extend( {}, $.fn.dropzone.defaults, options);

		var id = this.attr("id");
		var dropzone = document.getElementById(id);

		log("adding dnd-file-upload functionalities to element with id: " + id);

		// hack for safari on windows: due to not supported drop/dragenter/dragover events we have to create a invisible <input type="file" /> tag instead
		if ($.client.browser == "Safari" && $.client.os == "Windows") {
			var fileInput = $("<input>");
			fileInput.attr( {
				type : "file"
			});
			fileInput.bind("change", change);
			fileInput.css( {
				'opacity' : '0',
				'width' : '100%',
				'height' : '100%'
			});
			fileInput.attr("multiple", "multiple");
			fileInput.click(function() {
				return false;
			});
			this.append(fileInput);
		} else {
			dropzone.addEventListener("drop", drop, true);
			var jQueryDropzone = $("#" + id);
			jQueryDropzone.bind("dragenter", dragenter);
			jQueryDropzone.bind("dragover", dragover);
		}

		return this;
	};

	$.fn.dropzone.defaults = {
		url : "",
		method : "POST",
		numConcurrentUploads : 3,
		printLogs : false,
		// update upload speed every second
		uploadRateRefreshTime : 1000
	};

	// invoked when new files are dropped
	$.fn.dropzone.newFilesDropped = function() {
	};

	// invoked when the upload for given file has been started
	$.fn.dropzone.uploadStarted = function(fileIndex, file) {
	};

	// invoked when the upload for given file has been finished
	$.fn.dropzone.uploadFinished = function(fileIndex, file, time) {
	};

	// invoked when the progress for given file has changed
	$.fn.dropzone.fileUploadProgressUpdated = function(fileIndex, file,
			newProgress) {
	};

	// invoked when the upload speed of given file has changed
	$.fn.dropzone.fileUploadSpeedUpdated = function(fileIndex, file,
			KBperSecond) {
	};

	function dragenter(event) {
		event.stopPropagation();
		event.preventDefault();
		return false;
	}

	function dragover(event) {
		event.stopPropagation();
		event.preventDefault();
		return false;
	}

	function drop(event) {
		var dt = event.dataTransfer;
		var files = dt.files;

		event.preventDefault();
		uploadFiles(files);

		return false;
	}

	function log(logMsg) {
		if (opts.printLogs) {
			// console && console.log(logMsg);
		}
	}

	function uploadFiles(files) {
		$.fn.dropzone.newFilesDropped();
		for ( var i = 0; i < files.length; i++) {
			var file = files[i];

			// create a new xhr object
			var xhr = new XMLHttpRequest();
			var upload = xhr.upload;
			upload.fileIndex = i;
			upload.fileObj = file;
			upload.downloadStartTime = new Date().getTime();
			upload.currentStart = upload.downloadStartTime;
			upload.currentProgress = 0;
			upload.startData = 0;

			// add listeners
			upload.addEventListener("progress", progress, false);
			upload.addEventListener("load", load, false);

			xhr.open(opts.method, opts.url);
			xhr.setRequestHeader("Cache-Control", "no-cache");
			xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
			xhr.setRequestHeader("X-File-Name", file.fileName);
			xhr.setRequestHeader("X-File-Size", file.fileSize);
			xhr.setRequestHeader("Content-Type", "multipart/form-data");
			xhr.send(file);

			$.fn.dropzone.uploadStarted(i, file);
		}
	}

	function load(event) {
		var now = new Date().getTime();
		var timeDiff = now - this.downloadStartTime;
		$.fn.dropzone.uploadFinished(this.fileIndex, this.fileObj, timeDiff);
		log("finished loading of file " + this.fileIndex);
	}

	function progress(event) {
		if (event.lengthComputable) {
			var percentage = Math.round((event.loaded * 100) / event.total);
			if (this.currentProgress != percentage) {

				// log(this.fileIndex + " --> " + percentage + "%");

				this.currentProgress = percentage;
				$.fn.dropzone.fileUploadProgressUpdated(this.fileIndex, this.fileObj, this.currentProgress);

				var elapsed = new Date().getTime();
				var diffTime = elapsed - this.currentStart;
				if (diffTime >= opts.uploadRateRefreshTime) {
					var diffData = event.loaded - this.startData;
					var speed = diffData / diffTime; // in KB/sec

					$.fn.dropzone.fileUploadSpeedUpdated(this.fileIndex, this.fileObj, speed);

					this.startData = event.loaded;
					this.currentStart = elapsed;
				}
			}
		}
	}

	// invoked when the input field has changed and new files have been dropped
	// or selected
	function change(event) {
		event.preventDefault();

		// get all files ...
		var files = this.files;

		// ... and upload them
		uploadFiles(files);
	}

})(jQuery);
