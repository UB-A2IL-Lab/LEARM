# -*- coding: utf-8 -*-
"""
Created on Mon May 25 20:12:39 2020

@author: sinha
"""

import csv
import os
from datetime import datetime

def collect_date_cues_fromCSV(csvreader):
    delays = []
    date_time = []
    cue = []
    count = 0
    for row in csvreader:
        delay = row[3:4][0]
        video_type = row[-1]  
        if (count == 0):             
            count += 1
            continue
        date_time.append(row[2:3][0])
        
        if (video_type == ""):
           cue.append(row[5:6][0])
           delays.append(delay)
        else:
            cue.append(video_type)
            delays.append(video_type)

#    print (len(date_time), len(cue), len(delays))
#    print (delays)
    
    return date_time, delays, cue

def findTimestamp_hour_AMPM(date_time):
    new_date_time = []
    timestamps = []
    for item in date_time:
        elements = item.split(',')

        am_pm = elements[1].split()[1]
        time_values = elements[1].split()[0].split(':')
        hr, minute, sec = time_values
        if (am_pm == 'PM'):
            hr = str( int(hr) + 12 )
            
        time_values = hr + ':' + minute + ':' + sec
        
        new_item = elements[0] + ' ' + time_values
        timestamp = datetime.strptime(new_item, '%m/%d/%Y %H:%M:%S').timestamp()
        new_date_time.append ( new_item )
        timestamps.append(timestamp)
        
    return timestamps

def write_output(file, delays, timestamps, cue):
    start_timestamp = timestamps[0]
    writer = csv.writer(open(file + '_cueTimestamped.csv', 'w+', newline=''))
    print('Yes')
    txt_writer = open(file + '_cueTimestamp.txt', 'w+')
    all_cues = []
    prev_delay = "-1"
    last_timestamp = 0
    first_timestamp = 0
    last_cue = ""
    start_timestamp = timestamps[0]
    cue_end = False
    for i in range(len(delays)):
        next_delay = delays[i]
        curr_timestamp = timestamps[i]
        if (next_delay == prev_delay):
            cue_end = True
            last_timestamp = (curr_timestamp - start_timestamp) * 1000      # Multiplying by 1000 to get the value in milliseconds
            if (cue[i] != ""):
                last_cue = cue[i]
                all_cues.append(last_cue)
        else:
            if (cue_end):
                cue_end = False
                write_text = [str(first_timestamp), str(last_timestamp), last_cue]
                writer.writerow(write_text)
                txt_writer.write(str(first_timestamp) + ',' + str(last_timestamp) + ',' + last_cue + '\n')
            
            first_timestamp = (curr_timestamp - start_timestamp) * 1000     # Multiplying by 1000 to get the value in milliseconds
            prev_delay = next_delay
    
#    print (all_cues)
    write_text = [str(first_timestamp), str(last_timestamp), last_cue]
    writer.writerow(write_text)
    txt_writer.write(str(first_timestamp) + ',' + str(last_timestamp) + ',' + last_cue + '\n')


session_path = "../Sessions/"   
def main():
#    session_names = os.listdir(session_path)
#    for session_id in session_names:
    try:
#        path = session_path + session_id + "/session_data/"
        path = "../Sessions/IM179_5/session_data/"
        all_files = os.listdir(path)
        save_path = os.path.split(os.path.split(path)[0])[0]
        for file in all_files:
            filename = os.path.splitext(file)[0]
            ext = os.path.splitext(file)[1]
            if (ext == '.csv'):
                f = open(path + file)
                csvreader = csv.reader(f, delimiter = ',')
                
        #        delays = []
        #        date_time = []
        #        cue = []
        #        count = 0
        #        for row in csvreader:
        #            delay = row[3:4][0]
        #            video_type = row[-1]  
        #            if (count == 0):             
        #                count += 1
        #                continue
        #            date_time.append(row[2:3][0])
        #            
        #            if (video_type == ""):
        #               cue.append(row[5:6][0])
        #               delays.append(delay)
        #            else:
        #                cue.append(video_type)
        #                delays.append(video_type)
        #
        #        print (len(date_time), len(cue), len(delays))
        #        print (delays)
        #        new_date_time = []
        #        timestamps = []
        #        for item in date_time:
        #            elements = item.split(',')
        #
        #            am_pm = elements[1].split()[1]
        #            time_values = elements[1].split()[0].split(':')
        #            hr, minute, sec = time_values
        #            if (am_pm == 'PM'):
        #                hr = str( int(hr) + 12 )
        #                
        #            time_values = hr + ':' + minute + ':' + sec
        #            
        #            new_item = elements[0] + ' ' + time_values
        #            timestamp = datetime.strptime(new_item, '%m/%d/%Y %H:%M:%S').timestamp()
        #            new_date_time.append ( new_item )
        #            timestamps.append(timestamp)
                print ('1')
                date_time, delays, cue = collect_date_cues_fromCSV(csvreader)
                print('2')
                timestamps = findTimestamp_hour_AMPM(date_time)
                print('3')
                output_file = save_path + '/' + filename
                write_output(output_file, delays, timestamps, cue)
                print('4')
        #        start_timestamp = timestamps[0]
        #        output = open ( + '_cueTimestamped.csv', 'w+')
        #        
        #        prev_delay = "-1"
        #        last_timestamp = 0
        #        first_timestamp = 0
        #        last_cue = ""
        #        start_timestamp = timestamps[0]
        #        cue_end = False
        #        for i in range(len(delays)):
        #            next_delay = delays[i]
        #            curr_timestamp = timestamps[i]
        #            if (next_delay == prev_delay):
        #                cue_end = True
        #                last_timestamp = curr_timestamp - start_timestamp
        #                if (cue[i] != ""):
        #                    last_cue = cue[i]
        ##                    print (last_cue)
        #            else:
        #                if (cue_end):
        #                    cue_end = False
        #                    print (last_cue, '\n')
        #                    write_text = str(first_timestamp) + "," + str(last_timestamp) + "," + last_cue + "\n"
        #                    output.write(write_text)
        #                
        #                first_timestamp = curr_timestamp - start_timestamp
        #                prev_delay = next_delay
        #        
        #        print(last_cue)        
        #        write_text = str(first_timestamp) + "," + str(last_timestamp) + "," + last_cue + "\n"
        #        output.write(write_text)
        #        output.close()
    except:
        pass
        
if __name__ == "__main__":
    main()