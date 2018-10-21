<?php
namespace splitbrain\paste;

require_once __DIR__.'/PasteManager.php';

/* When did the script last run */
$modFile = 'modTime.txt';
if (date("F d Y H:i:s.", filemtime($modFile)) < date('F d Y H:i:s.',strtotime("-2 day"))) { //+ force_run - default
	
	// Run Script
	/* We first search and delete expired files */

	// Get Current Date
	$date = date('dmY');
	// Convert to String
	$dateS = (string) $date;
	
	/**
	 * Creating date collection between two dates
	 *
	 * <code>
	 * <?php
	 * # Example 1
	 * date_range("2014-01-01", "2014-01-20", "+1 day", "m/d/Y");
	 *
	 * # Example 2. you can use even time
	 * date_range("01:00:00", "23:00:00", "+1 hour", "H:i:s");
	 * </code>
	 *
	 * @author Ali OYGUR <alioygur@gmail.com>
	 * @param string since any date, time or datetime format
	 * @param string until any date, time or datetime format
	 * @param string step
	 * @param string date of output format
	 * @return array
	 */
	function date_range($first, $last, $step = '+1 day', $output_format = 'd/m/Y' ) {

		$dates = array();
		$current = strtotime($first);
		$last = strtotime($last);

		while( $current <= $last ) {

			$dates[] = date($output_format, $current);
			$current = strtotime($step, $current);
		}

		return $dates;
	}
	
	// Get array of dates to remove
	$dateFirst = min(date("F d Y H:i:s.", filemtime($modFile)), date('F d Y H:i:s.',strtotime("+2 day")));
	$dateLast = max(date("F d Y H:i:s.", filemtime($modFile)), date('F d Y H:i:s.',strtotime("+2 day")));
	$delArray = date_range(dateFirst, dateLast, $step = '+1 day', $output_format = 'dmY');

	// Delete Files That Match Criteria
	foreach ($delArray as $delDate){
		foreach (glob("../data/*/$delDate*.paste") as $filename) {
			unlink($filename);
		}
	}
	
	/* Replace File so date changes */
	// Delete
	unlink($modFile);
	// Create
	$modFile = 'modTime.txt';
	$handle = fopen($modFile, 'w') or die('Cannot open file:  '.$modFile);
	fclose($handle);

}

$paste = new PasteManager();

if(isset($_REQUEST['uid'])) {
    $_REQUEST['uid'] = preg_replace("#(*UTF8)[^A-Za-z0-9]#", '', $_REQUEST['uid']);
}

switch ($_REQUEST['do']) {
    case 'save':
		// We run the save command using the text box content and the expiry string calculated client side
        $ret = $paste->savePaste($_REQUEST['content'], $_REQUEST['expS']);
        break;
    case 'load':
        $ret = htmlspecialchars($paste->loadPaste($_REQUEST['uid']));
        break;
    case 'loadcomments':
        $ret = $paste->loadComments($_REQUEST['uid']);
        break;
    case 'savecomment':
        $ret = $paste->saveComment($_REQUEST['uid'], (int) $_REQUEST['line'], $_REQUEST['comment'], $_REQUEST['user']);
        break;
    default:
        $ret = false;
}

header('Content-Type: application/json');
echo json_encode($ret);

